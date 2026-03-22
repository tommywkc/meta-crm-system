const { query } = require('../db/pool');

/**
 * 获取全客户资料名单，支持多维度筛选
 * @param {Object} filters 筛选条件
 * @returns {Promise<Array>} 客户列表
 */
async function getCustomerReport(filters) {
  let sql = `
    SELECT 
      u.user_id,
      u.name,
      u.mobile,
      u.email,
      u.role,
      u.source,
      u.team,
      u.tags,
      u.create_time,
      u.suspension,
      s.name as sales_name,
      -- 聚合该客户参与的课程/活动
      string_agg(DISTINCT e.event_name, ', ') as enrolled_courses,
      MAX(en.enroll_time) as latest_enroll_time
    FROM USERS u
    LEFT JOIN USERS s ON u.owner_sales = s.user_id
    LEFT JOIN EVENT_ENROLLMENTS en ON u.user_id = en.user_id
    LEFT JOIN EVENTS e ON en.event_id = e.event_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // 1. 依课程筛选 (通过 event_id)
  if (filters.eventId) {
    sql += ` AND en.event_id = $${paramIndex++}`;
    params.push(filters.eventId);
  }

  // 2. 依来源筛选
  if (filters.source) {
    sql += ` AND u.source = $${paramIndex++}`;
    params.push(filters.source);
  }

  // 3. 依销售筛选
  if (filters.salesId) {
    sql += ` AND u.owner_sales = $${paramIndex++}`;
    params.push(filters.salesId);
  }

  // 4. 依期间筛选 (create_time 或 enroll_time，这里假设是客户创建时间，也可以改为报名时间)
  if (filters.startDate && filters.endDate) {
    sql += ` AND u.create_time BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    params.push(filters.startDate, filters.endDate);
  }

  // 分组，因为用了聚合函数
  sql += `
    GROUP BY u.user_id, u.name, u.mobile, u.email, u.role, u.source, u.team, u.tags, u.create_time, u.suspension, s.name
    ORDER BY u.create_time DESC
  `;

  try {
    const { rows } = await query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error fetching customer report:', error);
    throw error;
  }
}

module.exports = {
  getCustomerReport,
  /**
   * 取得課程/講座場次資訊與租場費用摘要
   * @param {Object} filters 篩選條件
   * @param {string} [filters.startDate] 起始日期 (yyyy-MM-dd)
   * @param {string} [filters.endDate] 結束日期 (yyyy-MM-dd)
   * @param {string} [filters.type] 課程類型 (CLASS/SEMINAR)
   * @returns {Promise<Array>} 事件與場次列表（含 sessions 陣列）
   */
  async getCourseSessionReport(filters = {}) {
    const { startDate, endDate, type } = filters;

    let sql = `
      SELECT
        e.event_id,
        e.event_name,
        e.type,
        e.location,
        e.room_cost,
        e.status,
        e.datetime_start AS event_datetime_start,
        e.datetime_end AS event_datetime_end,
        es.session_id,
        es.session_name,
        es.round,
        es.datetime_start AS session_datetime_start,
        es.datetime_end AS session_datetime_end
      FROM EVENTS e
      LEFT JOIN EVENT_SESSIONS es ON es.event_id = e.event_id
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    if (type) {
      sql += ` AND e.type = $${idx++}`;
      params.push(type);
    }

    if (startDate) {
      sql += ` AND COALESCE(es.datetime_start, e.datetime_start) >= $${idx++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND COALESCE(es.datetime_end, COALESCE(es.datetime_start, e.datetime_end)) <= $${idx++}`;
      params.push(endDate);
    }

    sql += `
      ORDER BY
        COALESCE(es.datetime_start, e.datetime_start) ASC NULLS LAST,
        e.event_id ASC,
        es.round ASC NULLS LAST,
        es.session_id ASC NULLS LAST
    `;

    try {
      const { rows } = await query(sql, params);
      const grouped = new Map();

      rows.forEach((row) => {
        if (!grouped.has(row.event_id)) {
          grouped.set(row.event_id, {
            event_id: row.event_id,
            event_name: row.event_name,
            type: row.type,
            location: row.location,
            room_cost: row.room_cost,
            status: row.status,
            event_datetime_start: row.event_datetime_start,
            event_datetime_end: row.event_datetime_end,
            sessions: []
          });
        }

        if (row.session_id) {
          grouped.get(row.event_id).sessions.push({
            session_id: row.session_id,
            session_name: row.session_name,
            round: row.round,
            datetime_start: row.session_datetime_start,
            datetime_end: row.session_datetime_end
          });
        }
      });

      return Array.from(grouped.values());
    } catch (error) {
      console.error('Error fetching course/session report:', error);
      throw error;
    }
  },

  async getMonthlyPromotions() {
    const sql = `SELECT * FROM MONTHLY_PROMOTIONS ORDER BY month_str DESC, created_at DESC`;
    const result = await query(sql);
    return result.rows;
  },

  async createMonthlyPromotion({ month_str, amount, receipt_path }) {
    const sql = `
        INSERT INTO MONTHLY_PROMOTIONS (month_str, amount, receipt_path)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const result = await query(sql, [month_str, amount, receipt_path]);
    return result.rows[0];
  },

  async deleteMonthlyPromotion(id) {
    const sql = `DELETE FROM MONTHLY_PROMOTIONS WHERE id = $1`;
    await query(sql, [id]);
    return true;
  },

  async getUnpaidCustomersReport() {
    const sql = `
      WITH UnpaidEvents AS (
        SELECT e.event_id, e.event_name, ee.user_id
        FROM EVENT_ENROLLMENTS ee
        JOIN EVENTS e ON ee.event_id = e.event_id
        WHERE e.type = 'CLASS'
          AND NOT EXISTS (
            SELECT 1 FROM PAYMENTS p 
            WHERE p.event_id = ee.event_id 
              AND p.user_id = ee.user_id 
              AND p.status = 'COMPLETED'
          )
      ),
      SeminarAttendance AS (
        SELECT r.user_id, string_agg(DISTINCT TO_CHAR(a.attend_time, 'YYYY-MM-DD'), ', ') as attend_dates
        FROM EVENT_ATTENDANCE a
        JOIN SESSION_REGISTRATIONS r ON a.registration_id = r.registration_id
        JOIN EVENT_SESSIONS s ON r.session_id = s.session_id
        JOIN EVENTS e ON s.event_id = e.event_id
        WHERE e.type = 'SEMINAR' AND a.status IN ('Y', 'G')
        GROUP BY r.user_id
      )
      SELECT 
        ue.event_id,
        ue.event_name as course_name,
        u.user_id,
        u.name,
        u.mobile,
        u.email,
        sa.attend_dates,
        CASE WHEN sa.user_id IS NOT NULL THEN true ELSE false END as attended_seminar
      FROM UnpaidEvents ue
      JOIN USERS u ON ue.user_id = u.user_id
      LEFT JOIN SeminarAttendance sa ON ue.user_id = sa.user_id
      ORDER BY ue.event_id, u.user_id
    `;
    const result = await query(sql);
    return result.rows;
  },

  async getFinancialReport(eventId, monthStr) {
    const sql = `
      WITH TargetUsers AS (
        SELECT DISTINCT r.user_id
        FROM EVENT_ATTENDANCE a
        JOIN SESSION_REGISTRATIONS r ON a.registration_id = r.registration_id
        JOIN EVENT_SESSIONS s ON r.session_id = s.session_id
        WHERE s.event_id = $1
          AND TO_CHAR(a.attend_time, 'YYYY-MM') = $2
          AND a.status IN ('Y', 'G')
      ),
      PaymentData AS (
        SELECT 
          p.amount, 
          p.method,
          u.referrer,
          u.owner_sales
        FROM PAYMENTS p
        JOIN USERS u ON p.user_id = u.user_id
        WHERE p.event_id = $1
          AND p.status = 'COMPLETED'
          AND p.user_id IN (SELECT user_id FROM TargetUsers)
      ),
      EventCosts AS (
        SELECT 
          COALESCE(room_cost, 0) as room_cost, 
          COALESCE(promotion_cost, 0) as total_promotion_cost, 
          COALESCE(misc_cost, 0) as total_misc_cost
        FROM EVENTS
        WHERE event_id = $1
      ),
      MonthCosts AS (
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM PROMOTIONS WHERE event_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2) as month_promotion_cost,
          (SELECT COALESCE(SUM(amount), 0) FROM MISC_EXPENSES WHERE event_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2) as month_misc_cost
      )
      SELECT 
        (SELECT COUNT(*) FROM TargetUsers) as enrollment_count,
        (SELECT COALESCE(SUM(amount), 0) FROM PaymentData) as total_sales,
        (SELECT COALESCE(SUM(
          CASE 
            WHEN method = 'CREDITCARD' THEN amount * 0.034
            WHEN method = 'PAYME' THEN amount * 0.012
            ELSE 0 
          END
        ), 0) FROM PaymentData) as payment_fees,
        (SELECT COALESCE(SUM(
          CASE WHEN referrer IS NOT NULL THEN 500 ELSE 0 END
        ), 0) FROM PaymentData) as referral_fees,
        (SELECT COALESCE(SUM(
          CASE WHEN owner_sales IS NOT NULL THEN amount * 0.1 ELSE 0 END
        ), 0) FROM PaymentData) as sales_commissions,
        (SELECT room_cost FROM EventCosts) as room_cost,
        (SELECT total_promotion_cost FROM EventCosts) as total_promotion_cost,
        (SELECT total_misc_cost FROM EventCosts) as total_misc_cost,
        (SELECT month_promotion_cost FROM MonthCosts) as month_promotion_cost,
        (SELECT month_misc_cost FROM MonthCosts) as month_misc_cost
    `;
    const result = await query(sql, [eventId, monthStr]);
    return result.rows[0];
  },

  async getActiveMonths(eventId) {
    const sql = `
      SELECT DISTINCT month_str FROM (
        SELECT TO_CHAR(a.attend_time, 'YYYY-MM') AS month_str
        FROM EVENT_ATTENDANCE a
        JOIN SESSION_REGISTRATIONS r ON a.registration_id = r.registration_id
        JOIN EVENT_SESSIONS s ON r.session_id = s.session_id
        WHERE s.event_id = $1 AND a.status IN ('Y', 'G') AND a.attend_time IS NOT NULL
        
        UNION
        
        SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month_str
        FROM PROMOTIONS
        WHERE event_id = $1 AND expense_date IS NOT NULL
        
        UNION
        
        SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month_str
        FROM MISC_EXPENSES
        WHERE event_id = $1 AND expense_date IS NOT NULL
        
        UNION

        SELECT TO_CHAR(paid_time, 'YYYY-MM') AS month_str
        FROM PAYMENTS
        WHERE event_id = $1 AND paid_time IS NOT NULL AND status IN ('COMPLETED', 'REFUNDED')
      ) AS combined_months
      WHERE month_str IS NOT NULL
      ORDER BY month_str DESC
    `;
    const result = await query(sql, [eventId]);
    return result.rows.map(row => row.month_str);
  }
};

