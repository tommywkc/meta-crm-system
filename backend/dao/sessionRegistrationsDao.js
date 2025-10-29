const { query } = require('../db/pool');

async function createRegistration({ session_id, user_id, channel = 'MEMBER', registration_by_id, registration_time = null, status = 'REGISTERED', note_special = null, attendance_id = null }) {
  const sql = `INSERT INTO session_registrations (session_id, user_id, channel, registration_by_id, registration_time, status, note_special, attendance_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
  const vals = [session_id, user_id, channel, registration_by_id, registration_time, status, note_special, attendance_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByRegistrationId(id) {
  const res = await query('SELECT * FROM session_registrations WHERE registration_id = $1', [id]);
  return res.rows[0] || null;
}

async function listRegistrationsBySession(session_id) {
  const res = await query('SELECT * FROM session_registrations WHERE session_id = $1 ORDER BY registration_id DESC', [session_id]);
  return res.rows;
}

async function removeRegistrationById(id) {
  await query('DELETE FROM session_registrations WHERE registration_id = $1', [id]);
  return true;
}

module.exports = { createRegistration, findByRegistrationId, listRegistrationsBySession, removeRegistrationById };
