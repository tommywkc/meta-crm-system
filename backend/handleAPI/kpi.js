const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { query } = require('../db/pool');
const { findUserByRole } = require('../dao/usersDao');
const { getKpiTarget, upsertKpiTarget } = require('../dao/kpiTargetsDao');

const METRIC_KEYS = [
  'conversionRate',
  'renewalRate',
  'actualReceiveAmount',
  'actualReceiveRate',
  'unpaidFollowupCount',
  'seminarConversion'
];

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function normalizeYearMonth({ year, month }) {
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) : (now.getMonth() + 1);
  if (!Number.isInteger(y) || y < 2000 || y > 3000) {
    return { ok: false, message: '年份不正確' };
  }
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { ok: false, message: '月份不正確' };
  }
  return { ok: true, year: y, month: m };
}

function dbRowToTarget(row) {
  if (!row) {
    return {
      conversionRate: null,
      renewalRate: null,
      actualReceiveAmount: null,
      actualReceiveRate: null,
      unpaidFollowupCount: null,
      seminarConversion: null,
    };
  }

  return {
    conversionRate: toNumberOrNull(row.conversion_rate),
    renewalRate: toNumberOrNull(row.renewal_rate),
    actualReceiveAmount: toNumberOrNull(row.actual_receive_amount),
    actualReceiveRate: toNumberOrNull(row.actual_receive_rate),
    unpaidFollowupCount: toNumberOrNull(row.unpaid_followup_count),
    seminarConversion: toNumberOrNull(row.seminar_conversion),
  };
}

function buildCompare(actualMetrics = {}, target = {}) {
  const compare = {};
  METRIC_KEYS.forEach((key) => {
    const actual = actualMetrics && Object.prototype.hasOwnProperty.call(actualMetrics, key) ? actualMetrics[key] : null;
    const tgt = target && Object.prototype.hasOwnProperty.call(target, key) ? target[key] : null;

    // status:
    // - For unpaidFollowupCount: 達成/未達成 (lower is better)
    // - For other metrics: 達成率 (actual / target) * 100%, can be > 100%
    let status = 'N/A';
    const actualNum = actual === null || actual === undefined ? null : Number(actual);
    const tgtNum = tgt === null || tgt === undefined ? null : Number(tgt);

    if (actualNum !== null && tgtNum !== null && !Number.isNaN(actualNum) && !Number.isNaN(tgtNum)) {
      if (key === 'unpaidFollowupCount') {
        status = actualNum <= tgtNum ? '達成' : '未達成';
      } else if (tgtNum === 0) {
        status = actualNum === 0 ? '100.0%' : 'N/A';
      } else {
        const pct = (actualNum / tgtNum) * 100;
        status = `${pct.toFixed(1)}%`;
      }
    }

    compare[key] = {
      actual: actual === undefined ? null : actual,
      target: tgt === undefined ? null : tgt,
      status,
    };
  });
  return compare;
}

// Helper to compute KPI for a given set of staff IDs
// seminarConversionMode:
// - 'rate': group/team KPI (percentage) = (unique free-seminar attendees in month who reached 30% paid for a paid class in month) / (unique free-seminar attendees in month)
// - 'count': personal KPI (number) = unique students converted by this staff set in month (first month reaching 30% paid), where student attended a free seminar before that first-threshold paid_time
async function computeKpiForStaffSet(staffIds, year, month, { seminarConversionMode = 'rate' } = {}) {
  const normalizedStaffIds = Array.isArray(staffIds)
    ? staffIds
        .map((id) => {
          const n = Number(id);
          return Number.isFinite(n) ? n : null;
        })
        .filter((id) => id !== null)
    : [];

  if (normalizedStaffIds.length === 0) {
    return {
      total_signed: 0,
      total_deals: 0,
      total_amount: 0,
      total_paid: 0,
      unpaid_followup: 0,
      metrics: {}
    };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const kpiQuery = `
    WITH relevant_enrollments AS (
      SELECT
        e.enrollment_id,
        e.event_id,
        e.user_id,
        e.enroll_by_id,
        u.name AS user_name,
        e.enroll_time,
        ev.type AS event_type,
        ev.price AS event_price
      FROM EVENT_ENROLLMENTS e
      LEFT JOIN EVENTS ev ON e.event_id = ev.event_id
      JOIN USERS u ON e.user_id = u.user_id
      WHERE e.enroll_by_id = ANY($1::bigint[])
        AND e.enroll_time >= $2 AND e.enroll_time <= $3
    ),
    staff_paid_class_enrollments AS (
      -- Paid classes (課堂) assigned by this staff set (no enroll_time filter)
      SELECT
        e.enrollment_id,
        e.event_id,
        e.user_id,
        e.enroll_by_id,
        COALESCE(ev.price, 0) AS class_price,
        e.enrollment_id::text AS pay_key,
        (e.event_id::text || ':' || e.user_id::text) AS alt_pay_key
      FROM EVENT_ENROLLMENTS e
      JOIN EVENTS ev ON e.event_id = ev.event_id
      WHERE e.enroll_by_id = ANY($1::bigint[])
        AND ev.type = 'CLASS'
        AND COALESCE(ev.price, 0) > 0
    ),
    paid_class_payment_progress AS (
      -- Cumulative paid per paid-class enrollment (or fallback event+user key)
      SELECT
        COALESCE(p.enrollment_id::text, (p.event_id::text || ':' || p.user_id::text)) AS pay_key,
        p.payment_id,
        p.event_id,
        p.user_id,
        p.paid_time,
        COALESCE(p.paid_amount, 0) AS paid_amount,
        COALESCE(ev.price, 0) AS class_price,
        SUM(COALESCE(p.paid_amount, 0)) OVER (
          PARTITION BY COALESCE(p.enrollment_id::text, (p.event_id::text || ':' || p.user_id::text))
          ORDER BY p.paid_time, p.payment_id
          ROWS UNBOUNDED PRECEDING
        ) AS cumulative_paid
      FROM PAYMENTS p
      JOIN EVENTS ev ON p.event_id = ev.event_id
      WHERE p.paid_time IS NOT NULL
        AND p.status IN ('COMPLETED', 'OUTSTANDING')
        AND COALESCE(p.paid_amount, 0) > 0
        AND ev.type = 'CLASS'
        AND COALESCE(ev.price, 0) > 0
    ),
    paid_class_first_threshold AS (
      -- Earliest paid_time where cumulative paid reaches >= 30% of class price
      SELECT
        pay_key,
        user_id,
        MIN(paid_time) AS first_threshold_paid_time
      FROM paid_class_payment_progress
      WHERE cumulative_paid >= (class_price * 0.3)
      GROUP BY pay_key, user_id
    ),
    payments_progress AS (
      -- Build per-enrollment (or fallback event+user) cumulative paid amounts over time.
      SELECT
        COALESCE(p.enrollment_id::text, (p.event_id::text || ':' || p.user_id::text)) AS pay_key,
        p.payment_id,
        p.event_id,
        p.user_id,
        p.paid_time,
        COALESCE(p.paid_amount, 0) AS paid_amount,
        SUM(COALESCE(p.paid_amount, 0)) OVER (
          PARTITION BY COALESCE(p.enrollment_id::text, (p.event_id::text || ':' || p.user_id::text))
          ORDER BY p.paid_time, p.payment_id
          ROWS UNBOUNDED PRECEDING
        ) AS cumulative_paid
      FROM PAYMENTS p
      WHERE p.paid_time IS NOT NULL
        AND p.status IN ('COMPLETED', 'OUTSTANDING')
        AND COALESCE(p.paid_amount, 0) > 0
    ),
    first_threshold_payment AS (
      -- Earliest time a student reaches >= 30% of the class price for an assigned paid class.
      SELECT
        sce.enrollment_id,
        sce.user_id,
        MIN(pp.paid_time) AS first_threshold_paid_time
      FROM staff_paid_class_enrollments sce
      JOIN payments_progress pp
        ON pp.pay_key = sce.pay_key
        OR pp.pay_key = sce.alt_pay_key
      WHERE pp.cumulative_paid >= (sce.class_price * 0.3)
      GROUP BY sce.enrollment_id, sce.user_id
    ),
    payments_agg AS (
      SELECT
        p.enrollment_id,
        SUM(p.amount) AS total_amount,
        SUM(p.paid_amount) AS total_paid,
        -- A deal is counted if any payment for that enrollment is completed
        MAX(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) as any_completed
      FROM PAYMENTS p
      WHERE p.enrollment_id IN (SELECT enrollment_id FROM relevant_enrollments)
      GROUP BY p.enrollment_id
    )
    SELECT
      -- Total enrollments made by this staff set
      COUNT(DISTINCT r.enrollment_id) AS total_signed,
      -- Total deals (enrollments with at least one completed payment)
      COUNT(DISTINCT CASE WHEN p.any_completed = 1 THEN r.enrollment_id END) AS total_deals,
      -- Sum of all expected payment amounts from these enrollments
      COALESCE(SUM(p.total_amount), 0) AS total_amount,
      -- Sum of all money actually received
      COALESCE(SUM(p.total_paid), 0) AS total_paid,
      -- Count of enrollments that have pending payments
      COUNT(DISTINCT CASE WHEN p.total_paid < p.total_amount THEN r.enrollment_id END) AS unpaid_followup,

      -- Group/team denominator: unique students who attended a free seminar in this month
      (
        SELECT COUNT(DISTINCT sr.user_id)
        FROM EVENT_ATTENDANCE a
        JOIN SESSION_REGISTRATIONS sr ON a.registration_id = sr.registration_id
        JOIN EVENT_SESSIONS ses ON sr.session_id = ses.session_id
        JOIN EVENTS sem ON ses.event_id = sem.event_id
        WHERE sem.type = 'SEMINAR'
          AND (sem.price IS NULL OR sem.price = 0)
          AND a.status IN ('G', 'Y')
          AND a.attend_time >= $2 AND a.attend_time <= $3
      ) AS group_free_seminar_attendees,

      -- Group/team numerator: among those attendees, unique students who paid for a paid class in this month (paid_time in month)
      (
        SELECT COUNT(DISTINCT sr.user_id)
        FROM EVENT_ATTENDANCE a
        JOIN SESSION_REGISTRATIONS sr ON a.registration_id = sr.registration_id
        JOIN EVENT_SESSIONS ses ON sr.session_id = ses.session_id
        JOIN EVENTS sem ON ses.event_id = sem.event_id
        WHERE sem.type = 'SEMINAR'
          AND (sem.price IS NULL OR sem.price = 0)
          AND a.status IN ('G', 'Y')
          AND a.attend_time >= $2 AND a.attend_time <= $3
          AND EXISTS (
            SELECT 1
            FROM staff_paid_class_enrollments sce
            JOIN first_threshold_payment ftp
              ON ftp.enrollment_id = sce.enrollment_id
              AND ftp.user_id = sce.user_id
            WHERE sce.user_id = sr.user_id
              AND ftp.first_threshold_paid_time >= $2 AND ftp.first_threshold_paid_time <= $3
              AND a.attend_time <= ftp.first_threshold_paid_time
          )
      ) AS group_seminar_attendee_to_paid_students,

      -- Personal KPI: unique converted students handled by this staff set (paid_time in month)
      (
        SELECT COUNT(DISTINCT sce.user_id)
        FROM staff_paid_class_enrollments sce
        JOIN first_threshold_payment ftp
          ON ftp.enrollment_id = sce.enrollment_id
          AND ftp.user_id = sce.user_id
        WHERE ftp.first_threshold_paid_time >= $2 AND ftp.first_threshold_paid_time <= $3
          AND EXISTS (
            SELECT 1
            FROM EVENT_ATTENDANCE a2
            JOIN SESSION_REGISTRATIONS sr2 ON a2.registration_id = sr2.registration_id
            JOIN EVENT_SESSIONS ses2 ON sr2.session_id = ses2.session_id
            JOIN EVENTS sem2 ON ses2.event_id = sem2.event_id
            WHERE sr2.user_id = sce.user_id
              AND sem2.type = 'SEMINAR'
              AND (sem2.price IS NULL OR sem2.price = 0)
              AND a2.status IN ('G', 'Y')
              AND a2.attend_time <= ftp.first_threshold_paid_time
          )
      ) AS personal_seminar_to_paid_students,

      -- Group/team denominator for renewal: all unique paid students in this month (first month reaching 30% paid)
      (
        SELECT COUNT(DISTINCT t.user_id)
        FROM paid_class_first_threshold t
        WHERE t.first_threshold_paid_time >= $2 AND t.first_threshold_paid_time <= $3
      ) AS group_paid_students_in_month,

      -- Group/team renewal numerator: unique students whose new paid lesson (reaching 30%) is handled by this staff set in month,
      -- and the student had a previous paid lesson reaching 30% at or before that time.
      (
        SELECT COUNT(DISTINCT sce.user_id)
        FROM staff_paid_class_enrollments sce
        JOIN first_threshold_payment ftp
          ON ftp.enrollment_id = sce.enrollment_id
          AND ftp.user_id = sce.user_id
        WHERE ftp.first_threshold_paid_time >= $2 AND ftp.first_threshold_paid_time <= $3
          AND EXISTS (
            SELECT 1
            FROM paid_class_first_threshold prev
            WHERE prev.user_id = sce.user_id
              AND prev.pay_key <> sce.pay_key
              AND prev.pay_key <> sce.alt_pay_key
              AND prev.first_threshold_paid_time <= ftp.first_threshold_paid_time
          )
      ) AS group_renewal_students,

      -- Personal renewal KPI: count unique renewed students credited to this staff set in month
      (
        SELECT COUNT(DISTINCT sce.user_id)
        FROM staff_paid_class_enrollments sce
        JOIN first_threshold_payment ftp
          ON ftp.enrollment_id = sce.enrollment_id
          AND ftp.user_id = sce.user_id
        WHERE ftp.first_threshold_paid_time >= $2 AND ftp.first_threshold_paid_time <= $3
          AND EXISTS (
            SELECT 1
            FROM paid_class_first_threshold prev
            WHERE prev.user_id = sce.user_id
              AND prev.pay_key <> sce.pay_key
              AND prev.pay_key <> sce.alt_pay_key
              AND prev.first_threshold_paid_time <= ftp.first_threshold_paid_time
          )
      ) AS personal_renewal_students
    FROM relevant_enrollments r
    LEFT JOIN payments_agg p ON r.enrollment_id = p.enrollment_id;
  `;

  const { rows } = await query(kpiQuery, [normalizedStaffIds, startDate, endDate]);
  const stats = rows[0];

  const totalSigned = Number(stats.total_signed) || 0;
  const totalDeals = Number(stats.total_deals) || 0;
  const totalAmount = Number(stats.total_amount) || 0;
  const totalPaid = Number(stats.total_paid) || 0;
  const unpaidFollowup = Number(stats.unpaid_followup) || 0;
  const groupFreeSeminarAttendees = Number(stats.group_free_seminar_attendees) || 0;
  const groupSeminarAttendeeToPaidStudents = Number(stats.group_seminar_attendee_to_paid_students) || 0;
  const personalSeminarToPaidStudents = Number(stats.personal_seminar_to_paid_students) || 0;
  const groupPaidStudentsInMonth = Number(stats.group_paid_students_in_month) || 0;
  const groupRenewalStudents = Number(stats.group_renewal_students) || 0;
  const personalRenewalStudents = Number(stats.personal_renewal_students) || 0;

  // Calculate derived metrics
  const conversionRate = totalSigned > 0 ? (totalDeals / totalSigned) : 0;
  const actualReceiveAmount = totalPaid;
  const actualReceiveRate = totalAmount > 0 ? (totalPaid / totalAmount) : 0;
  const unpaidFollowupCount = unpaidFollowup;
  const renewalRate = seminarConversionMode === 'count'
    ? personalRenewalStudents
    : (groupPaidStudentsInMonth > 0 ? (groupRenewalStudents / groupPaidStudentsInMonth) : 0);
  const seminarConversion = seminarConversionMode === 'count'
    ? personalSeminarToPaidStudents
    : (groupFreeSeminarAttendees > 0 ? (groupSeminarAttendeeToPaidStudents / groupFreeSeminarAttendees) : 0);

  return {
    total_signed: totalSigned,
    total_deals: totalDeals,
    total_amount: totalAmount,
    total_paid: totalPaid,
    unpaid_followup: unpaidFollowupCount,
    metrics: {
      conversionRate,
      renewalRate,
      actualReceiveAmount,
      actualReceiveRate,
      unpaidFollowupCount,
      seminarConversion,
    }
  };
}


router.get('/kpi/sales', authMiddleware, roleMiddleware(['sales', 'leader']), async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const targetYear = year ? parseInt(year) : currentYear;
    const targetMonth = month ? parseInt(month) : currentMonth;

    const { sub: currentUserId, role } = req.user;
    const roleKey = String(role || '').toLowerCase();

    // 1. Compute Personal KPI
    const personalKpi = await computeKpiForStaffSet([currentUserId], targetYear, targetMonth, { seminarConversionMode: 'count' });

    // Load personal target (set by admin)
    const personalTargetRow = await getKpiTarget({
      year: targetYear,
      month: targetMonth,
      scope: 'PERSONAL',
      userId: currentUserId
    });
    const personalTarget = dbRowToTarget(personalTargetRow);

    let teamKpi = null;
    let teamTarget = null;
    if (roleKey === 'leader') {
      // 2. For leaders, compute Team KPI
      // This assumes a 'team' or 'owner_sales' structure in the USERS table.
      // We will fetch all users who are 'sales' or 'leader' as a simplification.
      const salesTeam = await findUserByRole(['SALES', 'LEADER']);
      const teamIds = salesTeam.map(u => u.user_id);
      
      // Ensure the leader's own ID is in the set for team calculation
      if (!teamIds.includes(currentUserId)) {
          teamIds.push(currentUserId);
      }

      teamKpi = await computeKpiForStaffSet(teamIds, targetYear, targetMonth, { seminarConversionMode: 'rate' });

      // Load group target (set by admin)
      const groupTargetRow = await getKpiTarget({ year: targetYear, month: targetMonth, scope: 'GROUP' });
      teamTarget = dbRowToTarget(groupTargetRow);
    }

    res.json({
      role: roleKey,
      year: targetYear,
      month: targetMonth,
      personal: {
        ...personalKpi,
        target: personalTarget,
        compare: buildCompare(personalKpi.metrics, personalTarget)
      },
      team: teamKpi
        ? {
            ...teamKpi,
            target: teamTarget,
            compare: buildCompare(teamKpi.metrics, teamTarget)
          }
        : null,
    });

  } catch (error) {
    console.error('Failed to compute sales KPI:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


// Admin KPI: view team KPI + per-staff KPI, with editable targets.
router.get('/kpi/admin', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const normalized = normalizeYearMonth({ year: req.query.year, month: req.query.month });
    if (!normalized.ok) return res.status(400).json({ message: normalized.message });
    const { year: targetYear, month: targetMonth } = normalized;

    const staff = await findUserByRole(['SALES', 'LEADER']);
    const staffOptions = (staff || []).map((u) => ({
      user_id: u.user_id,
      name: u.name,
      role: u.role,
    }));

    const staffIds = staffOptions.map((u) => u.user_id).filter(Boolean);

    const requestedUserIdRaw = req.query.userId;
    const requestedUserId = requestedUserIdRaw ? parseInt(requestedUserIdRaw, 10) : null;
    const selectedUserId = requestedUserId || (staffIds[0] || null);

    const groupActual = await computeKpiForStaffSet(staffIds, targetYear, targetMonth, { seminarConversionMode: 'rate' });
    const personalActual = selectedUserId
      ? await computeKpiForStaffSet([selectedUserId], targetYear, targetMonth, { seminarConversionMode: 'count' })
      : await computeKpiForStaffSet([], targetYear, targetMonth);

    const groupTargetRow = await getKpiTarget({ year: targetYear, month: targetMonth, scope: 'GROUP' });
    const personalTargetRow = selectedUserId
      ? await getKpiTarget({ year: targetYear, month: targetMonth, scope: 'PERSONAL', userId: selectedUserId })
      : null;

    const groupTarget = dbRowToTarget(groupTargetRow);
    const personalTarget = dbRowToTarget(personalTargetRow);

    res.json({
      year: targetYear,
      month: targetMonth,
      staffOptions,
      group: {
        actual: groupActual,
        target: groupTarget,
        compare: buildCompare(groupActual.metrics, groupTarget),
      },
      personal: {
        userId: selectedUserId,
        actual: personalActual,
        target: personalTarget,
        compare: buildCompare(personalActual.metrics, personalTarget),
      },
    });
  } catch (error) {
    console.error('Failed to compute admin KPI:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/kpi/admin/targets', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { year, month, scope, userId, targets } = req.body || {};
    const normalized = normalizeYearMonth({ year, month });
    if (!normalized.ok) return res.status(400).json({ message: normalized.message });
    const { year: targetYear, month: targetMonth } = normalized;

    const normalizedScope = String(scope || '').trim().toUpperCase();
    if (!['GROUP', 'PERSONAL'].includes(normalizedScope)) {
      return res.status(400).json({ message: 'scope 必須為 GROUP 或 PERSONAL' });
    }

    const parsedUserId = userId !== undefined && userId !== null ? parseInt(userId, 10) : null;
    if (normalizedScope === 'PERSONAL' && !parsedUserId) {
      return res.status(400).json({ message: 'PERSONAL scope 需要 userId' });
    }

    const actorId = req.user && req.user.sub ? req.user.sub : null;
    const saved = await upsertKpiTarget({
      year: targetYear,
      month: targetMonth,
      scope: normalizedScope,
      userId: normalizedScope === 'PERSONAL' ? parsedUserId : null,
      targets: targets || {},
      actorId,
    });

    res.json({
      ok: true,
      target: dbRowToTarget(saved),
    });
  } catch (error) {
    console.error('Failed to save KPI target:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
