// Session registrations DAO — manage session sign-ups and queries
const { query } = require('../db/pool');

async function createRegistration({ session_id, user_id, channel = 'WEB', registration_by_id, registration_time = null, status = 'REGISTERED', note_special = null }) {
  const sql = `INSERT INTO SESSION_REGISTRATIONS (session_id, user_id, channel, registration_by_id, registration_time, status, note_special)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const vals = [session_id, user_id, channel, registration_by_id, registration_time, status, note_special];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findBySessionAndUser(session_id, user_id) {
  const sql = 'SELECT * FROM SESSION_REGISTRATIONS WHERE session_id = $1 AND user_id = $2 LIMIT 1';
  const res = await query(sql, [session_id, user_id]);
  return res.rows[0] || null;
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

// List session_ids that the user has registered for a specific event
async function listRegisteredSessionIdsByUserAndEvent(user_id, event_id) {
  const sql = `
    SELECT DISTINCT sr.session_id
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    WHERE sr.user_id = $1
      AND s.event_id = $2
  `;
  const res = await query(sql, [user_id, event_id]);
  return res.rows || [];
}

async function listUpcomingSessionsByUser(user_id, limit = 5, offset = 0) {
  const sql = `
    SELECT
      sr.registration_id,
      sr.session_id,
      sr.status AS registration_status,
      s.event_id,
      s.session_name,
      s.datetime_start,
      s.datetime_end,
      e.event_name,
      e.location
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    LEFT JOIN EVENTS e ON s.event_id = e.event_id
    WHERE sr.user_id = $1
      AND s.datetime_end > NOW() - INTERVAL '30 minutes'
    ORDER BY s.datetime_start ASC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [user_id, limit, offset]);
  return res.rows || [];
}

// List upcoming sessions (not yet started) for all users, ordered by time
async function listUpcomingSessionsAllUsers(limit = 100, offset = 0) {
  const sql = `
    SELECT
      sr.registration_id,
      sr.session_id,
      sr.user_id,
      u.name AS user_name,
      s.event_id,
      s.session_name,
      s.datetime_start,
      s.datetime_end,
      e.event_name,
      e.location
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    LEFT JOIN EVENTS e ON s.event_id = e.event_id
    LEFT JOIN USERS u ON sr.user_id = u.user_id
    WHERE s.datetime_end > NOW() - INTERVAL '30 minutes'
    ORDER BY s.datetime_start ASC
    LIMIT $1 OFFSET $2
  `;
  const res = await query(sql, [limit, offset]);
  return res.rows || [];
}

// Search upcoming sessions for current user with query
async function searchUpcomingSessionsByUser(user_id, limit = 100, offset = 0, q = '') {
  const pattern = q && q.trim() ? `%${q}%` : null;
  if (!pattern) return listUpcomingSessionsByUser(user_id, limit, offset);
  
  const sql = `
    SELECT
      sr.registration_id,
      sr.session_id,
      sr.status AS registration_status,
      s.event_id,
      s.session_name,
      s.datetime_start,
      s.datetime_end,
      e.event_name,
      e.location
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    LEFT JOIN EVENTS e ON s.event_id = e.event_id
    WHERE sr.user_id = $1
      AND s.datetime_end > NOW() - INTERVAL '30 minutes'
      AND (
        CAST(e.event_id AS TEXT) ILIKE $4
        OR e.event_name ILIKE $4
        OR s.session_name ILIKE $4
        OR e.location ILIKE $4
      )
    ORDER BY s.datetime_start ASC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [user_id, limit, offset, pattern]);
  return res.rows || [];
}

// Search upcoming sessions for all users with query
async function searchUpcomingSessionsAllUsers(limit = 100, offset = 0, q = '') {
  const pattern = q && q.trim() ? `%${q}%` : null;
  if (!pattern) return listUpcomingSessionsAllUsers(limit, offset);
  
  const sql = `
    SELECT
      sr.registration_id,
      sr.session_id,
      sr.user_id,
      u.name AS user_name,
      s.event_id,
      s.session_name,
      s.datetime_start,
      s.datetime_end,
      e.event_name,
      e.location
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    LEFT JOIN EVENTS e ON s.event_id = e.event_id
    LEFT JOIN USERS u ON sr.user_id = u.user_id
    WHERE s.datetime_end > NOW() - INTERVAL '30 minutes'
      AND (
        CAST(e.event_id AS TEXT) ILIKE $3
        OR e.event_name ILIKE $3
        OR s.session_name ILIKE $3
        OR e.location ILIKE $3
        OR u.name ILIKE $3
        OR CAST(u.user_id AS TEXT) ILIKE $3
      )
    ORDER BY s.datetime_start ASC
    LIMIT $1 OFFSET $2
  `;
  const res = await query(sql, [limit, offset, pattern]);
  return res.rows || [];
}

async function listSessionsByUserAndYear(user_id, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const sql = `
    SELECT
      sr.registration_id,
      sr.session_id,
      sr.status AS registration_status,
      s.event_id,
      s.session_name,
      s.datetime_start,
      s.datetime_end,
      e.event_name,
      e.location
    FROM SESSION_REGISTRATIONS sr
    JOIN EVENT_SESSIONS s ON sr.session_id = s.session_id
    LEFT JOIN EVENTS e ON s.event_id = e.event_id
    WHERE sr.user_id = $1
      AND s.datetime_start >= $2
      AND s.datetime_start < $3
      AND s.datetime_end > NOW() - INTERVAL '30 minutes'
    ORDER BY s.datetime_start ASC
  `;
  const res = await query(sql, [user_id, start, end]);
  return res.rows || [];
}

async function removeByRegistrationId(id) {
  await query('DELETE FROM SESSION_REGISTRATIONS WHERE registration_id = $1', [id]);
  return true;
}

async function updateRegistrationById(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByRegistrationId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE SESSION_REGISTRATIONS SET ${sets} WHERE registration_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

module.exports = {
  createRegistration,
  findByRegistrationId,
  listBySessionId,
  listByUserId,
  listUpcomingSessionsByUser,
  listUpcomingSessionsAllUsers,
  searchUpcomingSessionsByUser,
  searchUpcomingSessionsAllUsers,
  listSessionsByUserAndYear,
  removeByRegistrationId,
  findBySessionAndUser,
  listRegisteredSessionIdsByUserAndEvent,
  updateRegistrationById,
};
