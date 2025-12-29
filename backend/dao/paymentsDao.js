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
           u.name as user_name, u.email as user_email, 
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    WHERE p.payment_id = $1
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
}

async function listByUser(user_id) {
  const res = await query('SELECT * FROM PAYMENTS WHERE user_id = $1 ORDER BY payment_id DESC', [user_id]);
  return res.rows;
}

async function listByUserWithSearch(user_id, limit = 100, offset = 0, q = '', completedOnly = false, method = null, status = null) {
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

  if (method && method.trim() !== '') {
    params.push(method);
    where.push(`p.method = $${params.length}`);
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

  const sql = `
    SELECT p.*, 
           u.name as user_name, u.email as user_email,
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY p.payment_id DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function searchPayments(limit = 100, offset = 0, q = '', method = null, status = null) {
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

  if (method && method.trim() !== '') {
    params.push(method);
    where.push(`p.method = $${params.length}`);
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

  const sql = `
    SELECT p.*, 
           u.name as user_name, u.email as user_email,
           e.event_name,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN EVENTS e ON p.event_id = e.event_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    ${whereClause}
    ORDER BY p.payment_id DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function listByPaymentId(limit = 100, offset = 0) {
  const sql = `
    SELECT p.*, 
           u.name as user_name, u.email as user_email,
           c.name as casher_name
    FROM PAYMENTS p
    LEFT JOIN USERS u ON p.user_id = u.user_id
    LEFT JOIN USERS c ON p.casher_id = c.user_id
    ORDER BY p.payment_id DESC
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


module.exports = {
  createPayment,
  findByPaymentId,
  listByUser,
  listByUserWithSearch,
  searchPayments,
  removeByPaymentId,
  listByPaymentId,
  updatePaymentById,
};