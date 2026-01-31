// Requests DAO — handles user/registration requests and workflow
const { query } = require('../db/pool');

async function createRequest({
  request_type,
  registration_id = null,
  user_id,
  old_session_id = null,
  new_session_id = null,
  request_by_id = null,
  status = 'PENDING',
  remarks = null,
  under_3bday = null,
  time_conflict = null,
  conflict_id = null,
  priority_tier = null,
}) {
  const sql = `INSERT INTO requests (request_type, registration_id, user_id, old_session_id, new_session_id, request_by_id, status, remarks, under_3bday, time_conflict, conflict_id, priority_tier)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`;
  const vals = [request_type, registration_id, user_id, old_session_id, new_session_id, request_by_id, status, remarks, under_3bday, time_conflict, conflict_id, priority_tier];
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

async function findPendingByUserAndSession(user_id, { old_session_id = null, new_session_id = null } = {}) {
  if (old_session_id == null && new_session_id == null) {
    return null;
  }

  const conditions = [];
  const values = [user_id];
  let idx = 2;

  if (old_session_id != null) {
    conditions.push(`old_session_id = $${idx}`);
    values.push(old_session_id);
    idx += 1;
  }

  if (new_session_id != null) {
    conditions.push(`new_session_id = $${idx}`);
    values.push(new_session_id);
    idx += 1;
  }

  const sql = `
    SELECT *
    FROM REQUESTS
    WHERE user_id = $1
      AND status = 'PENDING'
      AND (${conditions.join(' OR ')})
    ORDER BY request_id DESC
    LIMIT 1
  `;

  const res = await query(sql, values);
  return res.rows[0] || null;
}

async function listAllRequests() {
  const sql = `
    SELECT
      r.request_id,
      r.request_type,
      r.status,
      r.request_time,
      r.determine_time,
      r.remarks,
      r.under_3bday,
      r.time_conflict,
      r.conflict_id,
      r.user_id,
      u.name AS user_name,
      u.mobile AS user_mobile,
      u.email AS user_email,
      r.request_by_id,
      req_by.name AS request_by_name,
      r.old_session_id,
      old_s.session_name AS old_session_name,
      old_s.datetime_start AS old_session_start,
      old_evt.event_name AS old_event_name,
      r.new_session_id,
      new_s.session_name AS new_session_name,
      new_s.datetime_start AS new_session_start,
      new_evt.event_name AS new_event_name
    FROM REQUESTS r
    LEFT JOIN USERS u ON r.user_id = u.user_id
    LEFT JOIN USERS req_by ON r.request_by_id = req_by.user_id
    LEFT JOIN EVENT_SESSIONS old_s ON r.old_session_id = old_s.session_id
    LEFT JOIN EVENTS old_evt ON old_s.event_id = old_evt.event_id
    LEFT JOIN EVENT_SESSIONS new_s ON r.new_session_id = new_s.session_id
    LEFT JOIN EVENTS new_evt ON new_s.event_id = new_evt.event_id
    ORDER BY r.request_time DESC NULLS LAST, r.request_id DESC
  `;
  const res = await query(sql, []);
  return res.rows || [];
}

async function listRequestsByUser(userId) {
  const sql = `
    SELECT
      r.request_id,
      r.request_type,
      r.status,
      r.request_time,
      r.determine_time,
      r.remarks,
      r.under_3bday,
      r.time_conflict,
      r.conflict_id,
      r.user_id,
      u.name AS user_name,
      u.mobile AS user_mobile,
      u.email AS user_email,
      r.request_by_id,
      req_by.name AS request_by_name,
      r.old_session_id,
      old_s.session_name AS old_session_name,
      old_s.datetime_start AS old_session_start,
      old_evt.event_name AS old_event_name,
      r.new_session_id,
      new_s.session_name AS new_session_name,
      new_s.datetime_start AS new_session_start,
      new_evt.event_name AS new_event_name
    FROM REQUESTS r
    LEFT JOIN USERS u ON r.user_id = u.user_id
    LEFT JOIN USERS req_by ON r.request_by_id = req_by.user_id
    LEFT JOIN EVENT_SESSIONS old_s ON r.old_session_id = old_s.session_id
    LEFT JOIN EVENTS old_evt ON old_s.event_id = old_evt.event_id
    LEFT JOIN EVENT_SESSIONS new_s ON r.new_session_id = new_s.session_id
    LEFT JOIN EVENTS new_evt ON new_s.event_id = new_evt.event_id
    WHERE r.user_id = $1
    ORDER BY r.request_time DESC NULLS LAST, r.request_id DESC
  `;
  const res = await query(sql, [userId]);
  return res.rows || [];
}

module.exports = {
  createRequest,
  findByRequestId,
  listByRegistrationId,
  listByUserId,
  removeByRequestId,
  findPendingByUserAndSession,
  listAllRequests,
  listRequestsByUser,
};
