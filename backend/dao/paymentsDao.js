const { query } = require('../db/pool');

async function createPayment({ event_id, user_id, amount, method, status = 'PENDING', paid_time = null, expire_time = null, receipt_number = null, issued_receipt = false, issued_certificate = false }) {
  const sql = `INSERT INTO payments (event_id, user_id, amount, method, status, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
  const vals = [event_id, user_id, amount, method, status, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM payments WHERE payment_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByUser(user_id) {
  const res = await query('SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_id DESC', [user_id]);
  return res.rows;
}

async function removePaymentById(id) {
  await query('DELETE FROM payments WHERE payment_id = $1', [id]);
  return true;
}

module.exports = { createPayment, findById, listByUser, removePaymentById };
