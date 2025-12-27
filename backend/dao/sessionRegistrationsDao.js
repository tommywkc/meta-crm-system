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

async function listUpcomingSessionsByUser(user_id, limit = 5) {
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
      AND s.datetime_start > NOW()
    ORDER BY s.datetime_start ASC
    LIMIT $2
  `;
  const res = await query(sql, [user_id, limit]);
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
    ORDER BY s.datetime_start ASC
  `;
  const res = await query(sql, [user_id, start, end]);
  return res.rows || [];
}

async function removeByRegistrationId(id) {
  await query('DELETE FROM SESSION_REGISTRATIONS WHERE registration_id = $1', [id]);
  return true;
}

module.exports = {
  createRegistration,
  findByRegistrationId,
  listBySessionId,
  listByUserId,
  listUpcomingSessionsByUser,
   listSessionsByUserAndYear,
  removeByRegistrationId,
  findBySessionAndUser,
};
