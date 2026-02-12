const { query } = require('../db/pool');

async function ensureCostsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS COSTS (
      cost_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      course_category VARCHAR(100),
      event_id BIGINT,
      cost_year INT NOT NULL,
      cost_month INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      description TEXT,
      receipt_url TEXT,
      created_by BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_costs_year_month ON COSTS(cost_year, cost_month);
    CREATE INDEX IF NOT EXISTS idx_costs_course ON COSTS(course_category);
  `;
  await query(sql);
}

async function ensureEventsCategoryColumn() {
  // Backward compatibility: add category column if it doesn't exist
  const sql = `ALTER TABLE IF EXISTS EVENTS ADD COLUMN IF NOT EXISTS category VARCHAR(100);`;
  await query(sql);
}

async function getAllCustomers({ course, source, dateStart, dateEnd, sales, keyword }) {
  await ensureEventsCategoryColumn();
  const params = [];
  let where = ' WHERE 1=1 ';
  if (course) {
    params.push(`%${course}%`);
    where += ` AND COALESCE(ev.category, ev.type) ILIKE $${params.length}`;
  }
  if (source) {
    params.push(`%${source}%`);
    where += ` AND u.source ILIKE $${params.length}`;
  }
  if (dateStart) {
    params.push(dateStart);
    where += ` AND u.create_time >= $${params.length}`;
  }
  if (dateEnd) {
    params.push(dateEnd);
    where += ` AND u.create_time <= $${params.length}`;
  }
  if (sales) {
    params.push(`%${sales}%`);
    where += ` AND s.name ILIKE $${params.length}`;
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    where += ` AND (u.name ILIKE $${params.length} OR u.mobile ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
  }

  const sql = `
    SELECT
      u.user_id,
      u.name,
      u.mobile,
      u.email,
      u.source,
      u.create_time,
      s.name AS sales_name,
      COALESCE(string_agg(DISTINCT COALESCE(ev.category, ev.type)::text, ', '), '') AS courses
    FROM USERS u
    LEFT JOIN USERS s ON u.owner_sales = s.user_id
    LEFT JOIN EVENT_ENROLLMENTS en ON en.user_id = u.user_id
    LEFT JOIN EVENTS ev ON ev.event_id = en.event_id
    ${where}
    GROUP BY u.user_id, s.name
    ORDER BY u.create_time DESC;
  `;
  const { rows } = await query(sql, params);
  return rows;
}

async function getCosts({ courseCategory, year, month }) {
  await ensureCostsTable();
  const params = [];
  let where = ' WHERE 1=1 ';
  if (courseCategory) {
    params.push(`%${courseCategory}%`);
    where += ` AND (course_category ILIKE $${params.length})`;
  }
  if (year) {
    params.push(parseInt(year, 10));
    where += ` AND cost_year = $${params.length}`;
  }
  if (month) {
    params.push(parseInt(month, 10));
    where += ` AND cost_month = $${params.length}`;
  }
  const sql = `
    SELECT * FROM COSTS
    ${where}
    ORDER BY cost_year DESC, cost_month DESC, cost_id DESC;
  `;
  const { rows } = await query(sql, params);

  // Summary by category and grand total under same filters
  const sumSql = `
    SELECT category, COALESCE(SUM(amount),0) AS total
    FROM COSTS
    ${where}
    GROUP BY category;
  `;
  const totalSql = `
    SELECT COALESCE(SUM(amount),0) AS total
    FROM COSTS
    ${where};
  `;
  const { rows: sumRows } = await query(sumSql, params);
  const { rows: totalRow } = await query(totalSql, params);

  const summary = {
    total: Number(totalRow?.[0]?.total || 0),
    byCategory: sumRows.reduce((acc, r) => {
      acc[r.category] = Number(r.total || 0);
      return acc;
    }, {})
  };

  return { items: rows, summary };
}

async function addCost({ category, course_category, event_id, year, month, amount, description, receipt_url, created_by }) {
  await ensureCostsTable();
  const sql = `
    INSERT INTO COSTS (category, course_category, event_id, cost_year, cost_month, amount, description, receipt_url, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
  const vals = [category, course_category || null, event_id || null, parseInt(year, 10), parseInt(month, 10), amount, description || null, receipt_url || null, created_by || null];
  const { rows } = await query(sql, vals);
  return rows[0];
}

async function deleteCost(id) {
  await ensureCostsTable();
  await query('DELETE FROM COSTS WHERE cost_id = $1', [id]);
  return true;
}

async function getCourseCustomerList({ courseCategory }) {
  await ensureEventsCategoryColumn();
  const params = [];
  let where = " WHERE p.status = 'COMPLETED' ";
  if (courseCategory) {
    params.push(`%${courseCategory}%`);
    where += ` AND COALESCE(ev.category, ev.type) ILIKE $${params.length}`;
  }
  const sql = `
    SELECT
      p.paid_time::date AS payment_date,
      p.paid_time::date AS balance_date,
      u.name,
      p.paid_amount AS payment_amount,
      p.method AS payment_method,
      u.mobile,
      to_char(COALESCE(ev.datetime_start, p.paid_time), 'YYYY-MM') AS settlement_month,
      ref.name AS referrer_name,
      sales.name AS sales_name,
      p.issued_receipt,
      p.issued_certificate
    FROM PAYMENTS p
    LEFT JOIN USERS u ON u.user_id = p.user_id
    LEFT JOIN EVENTS ev ON ev.event_id = p.event_id
    LEFT JOIN USERS ref ON ref.user_id = u.referrer
    LEFT JOIN USERS sales ON sales.user_id = u.owner_sales
    ${where}
    ORDER BY p.paid_time DESC NULLS LAST;
  `;
  const { rows } = await query(sql, params);
  return rows;
}

async function getUnpaidCustomers({ courseCategory, attended }) {
  await ensureEventsCategoryColumn();
  const params = [];
  let courseClause = '';
  if (courseCategory) {
    params.push(`%${courseCategory}%`);
    courseClause = ` AND COALESCE(ev.category, ev.type) ILIKE $${params.length}`;
  }

  const attendedCheck = attended === 'true';

  // Users with enrollments that have no completed payment
  if (attendedCheck) {
    const sql = `
      SELECT
        ev.event_name,
        COALESCE(ev.category, ev.type) as category,
        u.user_id,
        u.name,
        u.mobile,
        u.email,
        array_agg(DISTINCT to_char(att.attend_time, 'YYYY-MM-DD') ORDER BY to_char(att.attend_time, 'YYYY-MM-DD')) AS attend_dates
      FROM EVENT_ENROLLMENTS en
      JOIN USERS u ON u.user_id = en.user_id
      LEFT JOIN EVENTS ev ON ev.event_id = en.event_id
      LEFT JOIN EVENT_SESSIONS es ON es.event_id = en.event_id
      LEFT JOIN SESSION_REGISTRATIONS sr ON sr.session_id = es.session_id AND sr.user_id = en.user_id
      LEFT JOIN EVENT_ATTENDANCE att ON att.registration_id = sr.registration_id
      WHERE NOT EXISTS (
        SELECT 1 FROM PAYMENTS p WHERE p.enrollment_id = en.enrollment_id AND p.status = 'COMPLETED'
      )
        ${courseClause}
        AND att.attendance_id IS NOT NULL
        AND att.status IN ('G', 'Y')
      GROUP BY ev.event_id, ev.event_name, ev.category, ev.type, u.user_id, u.name, u.mobile, u.email
      ORDER BY category, ev.event_name, u.name;
    `;
    const { rows } = await query(sql, params);
    return rows;
  }

  const sql = `
    SELECT
      ev.event_name,
      COALESCE(ev.category, ev.type) as category,
      u.user_id,
      u.name,
      u.mobile,
      u.email
    FROM EVENT_ENROLLMENTS en
    JOIN USERS u ON u.user_id = en.user_id
    LEFT JOIN EVENTS ev ON ev.event_id = en.event_id
    WHERE NOT EXISTS (
      SELECT 1 FROM PAYMENTS p WHERE p.enrollment_id = en.enrollment_id AND p.status = 'COMPLETED'
    )
      ${courseClause}
      AND NOT EXISTS (
        SELECT 1
        FROM EVENT_SESSIONS es
        JOIN SESSION_REGISTRATIONS sr ON sr.session_id = es.session_id AND sr.user_id = en.user_id
        JOIN EVENT_ATTENDANCE att ON att.registration_id = sr.registration_id 
        WHERE es.event_id = en.event_id
        AND att.status IN ('G', 'Y')
      )
    GROUP BY ev.event_id, ev.event_name, ev.category, ev.type, u.user_id, u.name, u.mobile, u.email
    ORDER BY category, ev.event_name, u.name;
  `;
  const { rows } = await query(sql, params);
  return rows;
}

async function getFinancialData({ courseCategory, year, month }) {
    // Logic: Settlement Month = Month of First Attendance.
    // Fallback 1: Payment Deadline (expire_time) - useful for retroactive data entry where admin sets a past deadline.
    // Fallback 2: Payment Date (paid_time).
    const sql = `
    WITH EnrollmentStart AS (
      SELECT
        en.enrollment_id,
        MIN(att.attend_time) as first_attend_time
      FROM EVENT_ENROLLMENTS en
      JOIN SESSION_REGISTRATIONS sr ON sr.user_id = en.user_id
      JOIN EVENT_SESSIONS es ON es.session_id = sr.session_id AND es.event_id = en.event_id
      JOIN EVENT_ATTENDANCE att ON att.registration_id = sr.registration_id
      GROUP BY en.enrollment_id
    )
    SELECT
      COUNT(DISTINCT p.user_id) AS headcount,
      COALESCE(SUM(p.paid_amount),0) AS total_sales
    FROM PAYMENTS p
    LEFT JOIN EnrollmentStart es ON es.enrollment_id = p.enrollment_id
    LEFT JOIN EVENTS ev ON ev.event_id = p.event_id
    WHERE p.status = 'COMPLETED'
      AND EXTRACT(YEAR FROM COALESCE(es.first_attend_time, p.expire_time, p.paid_time)) = $1
      AND EXTRACT(MONTH FROM COALESCE(es.first_attend_time, p.expire_time, p.paid_time)) = $2
      ${courseClause};
  `;

  const { rows } = await query(sql, params);
  const row = rows[0] || {};
  const totalSales = Number(row.total_sales || 0);
  const headcount = Number(row.headcount || 0);
  const paymentFees = Math.round(totalSales * 0.03 * 100) / 100;

  await ensureCostsTable();
  const costParams = [parseInt(year, 10), parseInt(month, 10)];
  let costCourseClause = '';
  if (courseCategory) {
    costParams.push(`%${courseCategory}%`);
    costCourseClause = ` AND course_category ILIKE $${costParams.length}`;
  }
  const costSql = `
    SELECT category, COALESCE(SUM(amount),0) AS total
    FROM COSTS
    WHERE cost_year = $1 AND cost_month = $2
    ${costCourseClause}
    GROUP BY category;
  `;
  const costRes = await query(costSql, costParams);
  const costs = {};
  costRes.rows.forEach((c) => {
    costs[c.category] = Number(c.total || 0);
  });

  // Also aggregate costs from EVENTS table
  const eventCostParams = [parseInt(year, 10), parseInt(month, 10)];
  let eventCostClause = '';
  if (courseCategory) {
     eventCostParams.push(`%${courseCategory}%`);
     eventCostClause = ` AND COALESCE(category, type) ILIKE $${eventCostParams.length}`;
  }

  const eventCostSql = `
    SELECT 
      COALESCE(SUM(room_cost), 0) as rental_total,
      COALESCE(SUM(promotion_cost), 0) as promotion_total,
      COALESCE(SUM(misc_cost), 0) as misc_total,
      COALESCE(SUM(salary_cost), 0) as salary_total,
      COALESCE(SUM(freight_cost), 0) as freight_total,
      COALESCE(SUM(utilities_cost), 0) as utilities_total,
      COALESCE(SUM(telecom_cost), 0) as telecom_total,
      COALESCE(SUM(cog_cost), 0) as cog_total
    FROM EVENTS
    WHERE EXTRACT(YEAR FROM datetime_start) = $1
      AND EXTRACT(MONTH FROM datetime_start) = $2
      ${eventCostClause}
  `;
  
  const eventCostRes = await query(eventCostSql, eventCostParams);
  if (eventCostRes.rows.length > 0) {
      const r = eventCostRes.rows[0];
      costs['RENTAL'] = (costs['RENTAL'] || 0) + Number(r.rental_total || 0);
      costs['PROMOTION'] = (costs['PROMOTION'] || 0) + Number(r.promotion_total || 0);
      costs['MISC'] = (costs['MISC'] || 0) + Number(r.misc_total || 0);
      costs['SALARY'] = (costs['SALARY'] || 0) + Number(r.salary_total || 0);
      costs['FREIGHT'] = (costs['FREIGHT'] || 0) + Number(r.freight_total || 0);
      costs['UTILITIES'] = (costs['UTILITIES'] || 0) + Number(r.utilities_total || 0);
      costs['TELECOM'] = (costs['TELECOM'] || 0) + Number(r.telecom_total || 0);
      costs['COG'] = (costs['COG'] || 0) + Number(r.cog_total || 0);
  }

  return {
    headcount,
    totalSales,
    paymentFees,
    costs
  };
}

module.exports = {
  getAllCustomers,
  getCosts,
  addCost,
  deleteCost,
  getCourseCustomerList,
  getUnpaidCustomers,
  getFinancialData
};
