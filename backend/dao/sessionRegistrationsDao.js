const { query } = require('../db/pool');

async function createRegistration({ session_id, user_id, channel = 'MEMBER', registration_by_id, registration_time = null, status = 'REGISTERED', note_special = null, attendance_id = null }) {
  const sql = `INSERT INTO SESSION_REGISTRATIONS (session_id, user_id, channel, registration_by_id, registration_time, status, note_special, attendance_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
  const vals = [session_id, user_id, channel, registration_by_id, registration_time, status, note_special, attendance_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByRegistrationId(id) {
  const res = await query('SELECT * FROM SESSION_REGISTRATIONS WHERE registration_id = $1', [id]);
  return res.rows[0] || null;
}

async function listBySessionId(session_id) {
  const res = await query('SELECT * FROM SESSION_REGISTRATIONS WHERE session_id = $1 ORDER BY registration_id DESC', [session_id]);
  return res.rows;
}

async function listByUserId(user_id) {
  const res = await query('SELECT * FROM SESSION_REGISTRATIONS WHERE user_id = $1 ORDER BY registration_id DESC', [user_id]);
  return res.rows;
}

async function removeByRegistrationId(id) {
  await query('DELETE FROM SESSION_REGISTRATIONS WHERE registration_id = $1', [id]);
  return true;
}

module.exports = { createRegistration, findByRegistrationId, listBySessionId, listByUserId, removeByRegistrationId };
