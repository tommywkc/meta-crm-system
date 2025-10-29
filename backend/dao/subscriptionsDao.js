const { query } = require('../db/pool');

async function createSubscription({ user_id, service_id, datetime_start = null, datetime_end = null, account = null, password = null, status = null }) {
  const sql = `INSERT INTO subscriptions (user_id, service_id, datetime_start, datetime_end, account, password, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const vals = [user_id, service_id, datetime_start, datetime_end, account, password, status];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM subscriptions WHERE subscription_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByUser(user_id) {
  const res = await query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY subscription_id DESC', [user_id]);
  return res.rows;
}

async function removeSubscriptionById(id) {
  await query('DELETE FROM subscriptions WHERE subscription_id = $1', [id]);
  return true;
}

module.exports = { createSubscription, findById, listByUser, removeSubscriptionById };
