const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { query } = require('../db/pool');

// GET /api/kpi/sales?year=2025&month=11
// For SALES: returns personal KPI only.
// For LEADER: returns personal KPI + aggregated team KPI.
router.get('/kpi/sales', authMiddleware, roleMiddleware(['sales', 'leader']), async (req, res) => {
  try {
    const userId = req.user.sub;
    const role = (req.user.role || '').toUpperCase();

    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Helper to compute KPI for a set of staff user_ids (incharge = enroll_by_id)
    const computeKpiForStaffSet = async (staffIds) => {
      if (!staffIds || staffIds.length === 0) {
        return null;
      }

      const sql = `
        WITH relevant_enrollments AS (
          SELECT
            en.enrollment_id,
            en.user_id,
            en.enroll_by_id,
            u.name AS student_name,
            u.owner_sales,
            u.team,
            CASE
              WHEN en.enroll_by_id IS NULL OR en.enroll_by_id = en.user_id
                THEN 'self-enrolled'
              ELSE CAST(en.enroll_by_id AS TEXT)
            END AS incharge_code
          FROM EVENT_ENROLLMENTS en
          JOIN USERS u ON u.user_id = en.user_id
          WHERE en.enroll_by_id = ANY($1::bigint[])
            AND en.enroll_time >= $2
            AND en.enroll_time < $3
        ),
        payments_agg AS (
          SELECT
            re.enrollment_id,
            re.user_id,
            re.incharge_code,
            SUM(COALESCE(p.amount, 0))      AS total_amount,
            SUM(COALESCE(p.paid_amount, 0)) AS total_paid,
            BOOL_OR(p.status = 'COMPLETED') AS any_completed
          FROM relevant_enrollments re
          LEFT JOIN PAYMENTS p ON p.enrollment_id = re.enrollment_id
          GROUP BY re.enrollment_id, re.user_id, re.incharge_code
        )
        SELECT
          COUNT(*) AS total_signed,
          COUNT(*) FILTER (WHERE any_completed) AS total_deals,
          COALESCE(SUM(total_amount), 0) AS total_amount,
          COALESCE(SUM(total_paid), 0)   AS total_paid,
          COUNT(*) FILTER (WHERE total_paid < total_amount) AS unpaid_followup
        FROM payments_agg;
      `;

      const { rows } = await query(sql, [staffIds, start, end]);
      const row = rows[0] || {};

      const totalSigned = Number(row.total_signed || 0);
      const totalDeals = Number(row.total_deals || 0);
      const totalAmount = Number(row.total_amount || 0);
      const totalPaid = Number(row.total_paid || 0);
      const unpaidFollowup = Number(row.unpaid_followup || 0);

      const conversionRate = totalSigned > 0 ? (totalDeals / totalSigned) : 0;
      const actualReceiveRate = totalAmount > 0 ? (totalPaid / totalAmount) : 0;

      return {
        period: `${year}年${month}月`,
        metrics: {
          conversionRate,      // 成交率
          renewalRate: null,   // 續報率（尚未定義演算法，可之後補）
          actualReceiveAmount: totalPaid, // 實收金額
          actualReceiveRate,   // 實收比例
          unpaidFollowupCount: unpaidFollowup, // 未付款跟進量
          seminarConversion: null // 講座到課轉化（尚未定義演算法，可之後補）
        }
      };
    };

    // Personal KPI (for current staff)
    const personal = await computeKpiForStaffSet([userId]);

    let team = null;
    if (role === 'LEADER') {
      // Team = all SALES whose owner_sales or team links to this leader, plus leader themselves
      const teamSql = `
        SELECT DISTINCT u.user_id
        FROM USERS u
        WHERE u.role IN ('SALES', 'LEADER')
          AND (
            u.user_id = $1 OR
            u.owner_sales = $1 OR
            u.team = (SELECT team FROM USERS WHERE user_id = $1)
          );
      `;
      const { rows: teamRows } = await query(teamSql, [userId]);
      const staffIds = teamRows.map(r => r.user_id).filter(id => id != null);
      team = await computeKpiForStaffSet(staffIds);
    }

    return res.json({
      role,
      year,
      month,
      personal,
      team
    });
  } catch (err) {
    console.error('Failed to compute sales KPI:', err);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
