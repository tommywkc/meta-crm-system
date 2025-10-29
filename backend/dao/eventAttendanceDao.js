const { query } = require('../db/pool');

async function createEventAttendance({ session_id, user_id, registration_id = null, attend_time = null, status = null, remarks = null }) {
  const sql = `INSERT INTO event_attendance (session_id, user_id, registration_id, attend_time, status, remarks) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const vals = [session_id, user_id, registration_id, attend_time, status, remarks];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM event_attendance WHERE attendance_id = $1', [id]);
  return res.rows[0] || null;
}

async function listBySession(session_id) {
  const res = await query('SELECT * FROM event_attendance WHERE session_id = $1 ORDER BY attendance_id DESC', [session_id]);
  return res.rows;
}

async function removeEventAttendanceById(id) {
  await query('DELETE FROM event_attendance WHERE attendance_id = $1', [id]);
  return true;
}

module.exports = { createEventAttendance, findById, listBySession, removeEventAttendanceById };
