// Event attendance DAO — helpers for recording and querying attendance
const { query } = require('../db/pool');

async function createAttendance({ session_id, user_id, registration_id = null, attend_time = null, status = null, remarks = null }) {
  const sql = `INSERT INTO EVENT_ATTENDANCE (session_id, user_id, registration_id, attend_time, status, remarks) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const vals = [session_id, user_id, registration_id, attend_time, status, remarks];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByAttendanceId(id) {
  const res = await query('SELECT * FROM EVENT_ATTENDANCE WHERE attendance_id = $1', [id]);
  return res.rows[0] || null;
}

async function listBySessionId(session_id) {
  const res = await query('SELECT * FROM EVENT_ATTENDANCE WHERE session_id = $1 ORDER BY attendance_id DESC', [session_id]);
  return res.rows;
}

async function removeByAttendanceId(id) {
  await query('DELETE FROM EVENT_ATTENDANCE WHERE attendance_id = $1', [id]);
  return true;
}

module.exports = { createAttendance, findByAttendanceId, listBySessionId, removeByAttendanceId };
