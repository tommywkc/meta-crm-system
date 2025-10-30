const { query } = require('../db/pool');

async function createRequest({ registration_id, user_id, action, request_by_id, request_time = null, status = 'PENDING', determine_by_id = null, determine_time = null, remarks = null, under_3bday = null, priority_tier = null }) {
  const sql = `INSERT INTO requests (registration_id, user_id, action, request_by_id, request_time, status, determine_by_id, determine_time, remarks, under_3bday, priority_tier)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
  const vals = [registration_id, user_id, action, request_by_id, request_time, status, determine_by_id, determine_time, remarks, under_3bday, priority_tier];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByRequestId(id) {
  const res = await query('SELECT * FROM REQUESTS WHERE request_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByRegistrationId(registration_id) {
  const res = await query('SELECT * FROM REQUESTS WHERE registration_id = $1 ORDER BY request_id DESC', [registration_id]);
  return res.rows;
}

async function listByUserId(user_id) {
  const res = await query('SELECT * FROM REQUESTS WHERE user_id = $1 ORDER BY request_id DESC', [user_id]);
  return res.rows;
}

async function removeByRequestId(id) {
  await query('DELETE FROM REQUESTS WHERE request_id = $1', [id]);
  return true;
}

module.exports = { createRequest, findByRequestId, listByRegistrationId, listByUserId, removeByRequestId };
