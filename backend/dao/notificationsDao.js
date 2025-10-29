const { query } = require('../db/pool');

async function createNotification({ description, template, create_time = null, created_by_id = null }) {
  const sql = `INSERT INTO notifications (description, template, create_time, created_by_id) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [description, template, create_time, created_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByNotificationId(id) {
  const res = await query('SELECT * FROM notifications WHERE notification_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByNotificationId(limit = 50) {
  const res = await query('SELECT * FROM notifications ORDER BY notification_id DESC LIMIT $1', [limit]);
  return res.rows;
}

async function removeByNotificationId(id) {
  await query('DELETE FROM notifications WHERE notification_id = $1', [id]);
  return true;
}

module.exports = { createNotification, findByNotificationId, listByNotificationId, removeByNotificationId };
