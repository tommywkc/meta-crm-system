// Notifications DAO — helpers for notification templates and records
const { query } = require('../db/pool');

async function createNotification({ user_id, description, template, created_by_id = null, create_time = null }) {
  // create_time is handled by DB default; optional param kept for flexibility
  const sql = `INSERT INTO NOTIFICATIONS (user_id, description, template, created_by_id) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [user_id, description, template, created_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByNotificationId(id) {
  const res = await query('SELECT * FROM NOTIFICATIONS WHERE notification_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByNotificationId(limit = 50) {
  const res = await query('SELECT * FROM NOTIFICATIONS ORDER BY notification_id DESC LIMIT $1', [limit]);
  return res.rows;
}

async function listByUserId(user_id, limit = 50, offset = 0) {
  const res = await query('SELECT * FROM NOTIFICATIONS WHERE user_id = $1 ORDER BY notification_id DESC LIMIT $2 OFFSET $3', [user_id, limit, offset]);
  return res.rows;
}

async function removeByNotificationId(id) {
  await query('DELETE FROM NOTIFICATIONS WHERE notification_id = $1', [id]);
  return true;
}

module.exports = { createNotification, findByNotificationId, listByNotificationId, listByUserId, removeByNotificationId };
