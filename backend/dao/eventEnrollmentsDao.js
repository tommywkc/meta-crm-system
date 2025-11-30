const { query } = require('../db/pool');

async function createEnrollment({ event_id, user_id, enroll_by_id }) {
  const sql = `INSERT INTO EVENT_ENROLLMENTS (event_id, user_id, enroll_by_id) VALUES ($1,$2,$3) RETURNING *`;
  const vals = [event_id, user_id, enroll_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByEnrollmentId(id) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE enrollment_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByEvent(event_id) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE event_id = $1 ORDER BY enrollment_id DESC', [event_id]);
  return res.rows;
}

async function listByUser(user_id) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE user_id = $1 ORDER BY enrollment_id DESC', [user_id]);
  return res.rows;
}

async function findIfExist(user_id, event_id) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE user_id = $1 AND event_id = $2', [user_id, event_id]);
  return res.rows[0] || null;
}

async function removeByEnrollmentId(id) {
  await query('DELETE FROM EVENT_ENROLLMENTS WHERE enrollment_id = $1', [id]);
  return true;
}

module.exports = { createEnrollment, findByEnrollmentId, listByUser, listByEvent, removeByEnrollmentId, findIfExist };
