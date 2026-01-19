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

async function updateStatusByEnrollmentId(id, status) {
  const sql = 'UPDATE EVENT_ENROLLMENTS SET status = $1 WHERE enrollment_id = $2 RETURNING *';
  const vals = [status, id];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function checkIsConfirmedEnrolled(user_id, event_id) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE user_id = $1 AND event_id = $2 AND status = $3', [user_id, event_id, 'CONFIRMED']);
  return res.rows[0] || null;
}

async function listConfirmedEnrolled(user_id, limit = 100, offset = 0) {
  const res = await query('SELECT * FROM EVENT_ENROLLMENTS WHERE user_id = $1 AND status = $2 ORDER BY enrollment_id DESC LIMIT $3 OFFSET $4', [user_id, 'CONFIRMED', limit, offset]);
  return res.rows || null;
}

// List event_ids where the user has an active (PENDING or CONFIRMED) enrollment
async function listActiveEnrolledEventIds(user_id) {
  const sql = `
    SELECT DISTINCT event_id
    FROM EVENT_ENROLLMENTS
    WHERE user_id = $1
      AND status IN ('PENDING', 'CONFIRMED')
  `;
  const res = await query(sql, [user_id]);
  return res.rows || [];
}

async function listConfirmedUsersByEvent(event_id) {
  const sql = `
    SELECT DISTINCT u.user_id, u.name, u.role, u.mobile, u.email
    FROM EVENT_ENROLLMENTS e
    JOIN USERS u ON e.user_id = u.user_id
    WHERE e.event_id = $1
      AND e.status = 'CONFIRMED'
    ORDER BY u.user_id
  `;
  const res = await query(sql, [event_id]);
  return res.rows || [];
}

module.exports = {
  createEnrollment,
  findByEnrollmentId,
  listByUser,
  listByEvent,
  removeByEnrollmentId,
  findIfExist,
  updateStatusByEnrollmentId,
  checkIsConfirmedEnrolled,
  listConfirmedEnrolled,
  listConfirmedUsersByEvent,
  listActiveEnrolledEventIds,
};