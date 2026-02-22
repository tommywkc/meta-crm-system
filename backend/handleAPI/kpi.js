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
async function computeKpiForStaffSet(staffIds, year, month) {
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
        e.enroll_time
      FROM EVENT_ENROLLMENTS e
      JOIN USERS u ON e.user_id = u.user_id
      WHERE e.enroll_by_id = ANY($1::int[])
        AND e.enroll_time >= $2 AND e.enroll_time <= $3
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
      COUNT(DISTINCT CASE WHEN p.total_paid < p.total_amount THEN r.enrollment_id END) AS unpaid_followup
    FROM relevant_enrollments r
    LEFT JOIN payments_agg p ON r.enrollment_id = p.enrollment_id;
  `;

  const kpiQueryBigint = kpiQuery.replace('$1::int[]', '$1::bigint[]');
  const { rows } = await query(kpiQueryBigint, [normalizedStaffIds, startDate, endDate]);
  const stats = rows[0];

  const totalSigned = Number(stats.total_signed) || 0;
  const totalDeals = Number(stats.total_deals) || 0;
  const totalAmount = Number(stats.total_amount) || 0;
  const totalPaid = Number(stats.total_paid) || 0;
  const unpaidFollowup = Number(stats.unpaid_followup) || 0;

  // Calculate derived metrics
  const conversionRate = totalSigned > 0 ? (totalDeals / totalSigned) : 0;
  const actualReceiveAmount = totalPaid;
  const actualReceiveRate = totalAmount > 0 ? (totalPaid / totalAmount) : 0;
  const unpaidFollowupCount = unpaidFollowup;
  // Placeholders for future metrics
  const renewalRate = null; // Logic to be defined
  const seminarConversion = null; // Logic to be defined

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
    const personalKpi = await computeKpiForStaffSet([currentUserId], targetYear, targetMonth);

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

      teamKpi = await computeKpiForStaffSet(teamIds, targetYear, targetMonth);

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

    const groupActual = await computeKpiForStaffSet(staffIds, targetYear, targetMonth);
    const personalActual = selectedUserId
      ? await computeKpiForStaffSet([selectedUserId], targetYear, targetMonth)
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
