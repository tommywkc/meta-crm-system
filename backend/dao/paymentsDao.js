// Payments DAO — handles payment records and queries
const { query } = require('../db/pool');

async function createPayment({ event_id, user_id, enrollment_id, amount, method, status = 'PENDING', paid_time = null, expire_time = null, receipt_number = null, issued_receipt = false, issued_certificate = false }) {
  const sql = `INSERT INTO PAYMENTS (event_id, user_id, enrollment_id, amount, method, status, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
  const vals = [event_id, user_id, enrollment_id, amount, method, status, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByPaymentId(id) {
  const sql = `
    SELECT p.*, 
           u.name as user_name, u.email as user_email, u.mobile as user_mobile, 
           ref.name as user_referrer_name, sales.name as user_owner_sales_name,
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS ref ON u.referrer = ref.user_id
    LEFT JOIN USERS sales ON u.owner_sales = sales.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    WHERE p.payment_id = $1
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
}

async function findPaymentByEventAndUser(event_id, user_id) {
  const sql = `
    SELECT *
    FROM PAYMENTS
    WHERE event_id = $1 AND user_id = $2
    ORDER BY payment_id DESC
    LIMIT 1
  `;
  const res = await query(sql, [event_id, user_id]);
  return res.rows[0] || null;
}

async function listByUser(user_id, limit = 100, offset = 0, sortBy = 'payment_id', sortOrder = 'desc') {
  const allowedSortColumns = ['payment_id', 'event_id', 'amount', 'method', 'status', 'paid_time', 'receipt_number'];
  const actualSortBy = allowedSortColumns.includes(sortBy) ? `p.${sortBy}` : 'p.payment_id';
  const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sql = `
    SELECT p.*,
           u.name as user_name, u.email as user_email, u.mobile as user_mobile, 
           ref.name as user_referrer_name, sales.name as user_owner_sales_name,
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS ref ON u.referrer = ref.user_id
    LEFT JOIN USERS sales ON u.owner_sales = sales.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    WHERE p.user_id = $1
    ORDER BY ${actualSortBy} ${actualSortOrder}
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [user_id, limit, offset]);
  return res.rows;
}

async function listByUserWithSearch(user_id, limit = 100, offset = 0, q = '', completedOnly = false, method = null, status = null, sortBy = 'payment_id', sortOrder = 'desc') {
  const params = [];
  params.push(user_id); // $1

  const where = [`p.user_id = $1`];

  if (completedOnly) {
    where.push("upper(p.status) = 'COMPLETED'");
  }

  if (q && q.trim() !== '') {
    const pattern = `%${q}%`;
    params.push(pattern); // will be $n
    const pidx = `$${params.length}`;
    where.push(`(
      CAST(p.payment_id AS TEXT) ILIKE ${pidx} OR
      CAST(e.event_id AS TEXT) ILIKE ${pidx} OR
      e.event_name ILIKE ${pidx} OR
      p.status ILIKE ${pidx} OR
      p.receipt_number ILIKE ${pidx} OR
      u.name ILIKE ${pidx} OR
      u.email ILIKE ${pidx}
    )`);
  }

  if (method) {
    const methodArr = Array.isArray(method) ? method : String(method).split(',').map(s => s.trim()).filter(Boolean);
    if (methodArr.length > 0) {
      params.push(methodArr);
      where.push(`p.method = ANY($${params.length})`);
    }
  }

  if (status) {
    // status may be an array or a single string; normalize to array
    const statusArr = Array.isArray(status) ? status : String(status).split(',').map(s => s.trim()).filter(Boolean);
    if (statusArr.length > 0) {
      params.push(statusArr);
      where.push(`p.status = ANY($${params.length})`);
    }
  }

  // add limit and offset
  params.push(limit);
  params.push(offset);

  const allowedSortColumns = ['payment_id', 'event_id', 'amount', 'method', 'status', 'paid_time', 'receipt_number'];
  const actualSortBy = allowedSortColumns.includes(sortBy) ? `p.${sortBy}` : 'p.payment_id';
  const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT p.*,
           u.name as user_name, u.email as user_email, u.mobile as user_mobile, 
           ref.name as user_referrer_name, sales.name as user_owner_sales_name, 
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS ref ON u.referrer = ref.user_id
    LEFT JOIN USERS sales ON u.owner_sales = sales.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${actualSortBy} ${actualSortOrder}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function searchPayments(limit = 100, offset = 0, q = '', method = null, status = null, sortBy = 'payment_id', sortOrder = 'desc') {
  const params = [];
  const where = [];

  if (q && q.trim() !== '') {
    params.push(`%${q}%`);
    const pidx = `$1`;
    where.push(`(
      CAST(p.payment_id AS TEXT) ILIKE ${pidx} OR
      CAST(e.event_id AS TEXT) ILIKE ${pidx} OR
      e.event_name ILIKE ${pidx} OR
      p.status ILIKE ${pidx} OR
      p.receipt_number ILIKE ${pidx} OR
      u.name ILIKE ${pidx} OR
      u.email ILIKE ${pidx}
    )`);
  }

  if (method) {
    const methodArr = Array.isArray(method) ? method : String(method).split(',').map(s => s.trim()).filter(Boolean);
    if (methodArr.length > 0) {
      params.push(methodArr);
      where.push(`p.method = ANY($${params.length})`);
    }
  }

  if (status) {
    const statusArr = Array.isArray(status) ? status : String(status).split(',').map(s => s.trim()).filter(Boolean);
    if (statusArr.length > 0) {
      params.push(statusArr);
      where.push(`p.status = ANY($${params.length})`);
    }
  }

  // push limit and offset
  params.push(limit);
  params.push(offset);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';       

  const allowedSortColumns = ['payment_id', 'event_id', 'amount', 'method', 'status', 'paid_time', 'receipt_number'];
  const actualSortBy = allowedSortColumns.includes(sortBy) ? `p.${sortBy}` : 'p.payment_id';
  const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT p.*,
           u.name as user_name, u.email as user_email, u.mobile as user_mobile, 
           ref.name as user_referrer_name, sales.name as user_owner_sales_name, 
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS ref ON u.referrer = ref.user_id
    LEFT JOIN USERS sales ON u.owner_sales = sales.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    ${whereClause}
    ORDER BY ${actualSortBy} ${actualSortOrder}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function listByPaymentId(limit = 100, offset = 0, sortBy = 'payment_id', sortOrder = 'desc') {
  const allowedSortColumns = ['payment_id', 'event_id', 'amount', 'method', 'status', 'paid_time', 'receipt_number'];
  const actualSortBy = allowedSortColumns.includes(sortBy) ? `p.${sortBy}` : 'p.payment_id';
  const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sql = `
    SELECT p.*,
           u.name as user_name, u.email as user_email, u.mobile as user_mobile, 
           ref.name as user_referrer_name, sales.name as user_owner_sales_name, 
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS ref ON u.referrer = ref.user_id
    LEFT JOIN USERS sales ON u.owner_sales = sales.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    ORDER BY ${actualSortBy} ${actualSortOrder}
    LIMIT $1 OFFSET $2
  `;
  const res = await query(sql, [limit, offset]);
  return res.rows;
}


async function removeByPaymentId(id) {
  await query('DELETE FROM PAYMENTS WHERE payment_id = $1', [id]);
  return true;
}

async function updatePaymentById(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByPaymentId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE PAYMENTS SET ${sets} WHERE payment_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function findPaymentsByUserAndEvent(user_id, event_id) {
  const sql = `SELECT * FROM PAYMENTS WHERE user_id = $1 AND event_id = $2 ORDER BY payment_id DESC`;
  const res = await query(sql, [user_id, event_id]);
  return res.rows;
}


module.exports = {
  createPayment,
  findByPaymentId,
  findPaymentByEventAndUser,
  listByUser,
  listByUserWithSearch,
  searchPayments,
  removeByPaymentId,
  listByPaymentId,
  updatePaymentById,
  findPaymentsByUserAndEvent,
};