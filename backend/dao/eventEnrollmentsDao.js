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

async function listUsersByEventWithStatuses(event_id, statuses = ['CONFIRMED']) {
  const hasStatuses = Array.isArray(statuses) && statuses.length > 0;
  const params = [event_id];
  let statusClause = '';

  if (hasStatuses) {
    params.push(statuses);
    statusClause = `AND e.status = ANY($${params.length})`;
  }

  const sql = `
    SELECT DISTINCT
      e.enrollment_id,
      e.status,
      u.user_id,
      u.name,
      u.role,
      u.mobile,
      u.email,
      p.payment_id,
      p.issued_certificate,
      p.issued_receipt
    FROM EVENT_ENROLLMENTS e
    JOIN USERS u ON e.user_id = u.user_id
    LEFT JOIN PAYMENTS p ON p.enrollment_id = e.enrollment_id
    WHERE e.event_id = $1
      ${statusClause}
    ORDER BY u.user_id
  `;

  const res = await query(sql, params);
  return res.rows || [];
}

async function listConfirmedUsersByEvent(event_id) {
  return listUsersByEventWithStatuses(event_id, ['CONFIRMED']);
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
  listUsersByEventWithStatuses,
  listActiveEnrolledEventIds,
};