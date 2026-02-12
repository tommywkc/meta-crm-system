const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { query } = require('../db/pool');
const { findUserByRole } = require('../dao/usersDao');

// Helper to compute KPI for a given set of staff IDs
async function computeKpiForStaffSet(staffIds, year, month) {
  if (!staffIds || staffIds.length === 0) {
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

  const { rows } = await query(kpiQuery, [staffIds, startDate, endDate]);
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

    // 1. Compute Personal KPI
    const personalKpi = await computeKpiForStaffSet([currentUserId], targetYear, targetMonth);

    let teamKpi = null;
    if (role === 'leader') {
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
    }

    res.json({
      role,
      year: targetYear,
      month: targetMonth,
      personal: personalKpi,
      team: teamKpi,
    });

  } catch (error) {
    console.error('Failed to compute sales KPI:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
