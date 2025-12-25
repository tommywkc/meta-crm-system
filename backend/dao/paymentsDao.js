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

async function listByUser(user_id, limit = 100, offset = 0) {
  const res = await query('SELECT * FROM PAYMENTS WHERE user_id = $1 ORDER BY payment_id DESC LIMIT $2 OFFSET $3', [user_id, limit, offset]);
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


module.exports = { createPayment, findByPaymentId, listByUser, removeByPaymentId, listByPaymentId, updatePaymentById };