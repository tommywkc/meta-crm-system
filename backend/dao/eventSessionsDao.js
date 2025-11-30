// Event sessions DAO — helpers for creating and managing event sessions
const { query } = require('../db/pool');

async function createSession({ event_id, session_name, description = null, capacity = null, datetime_start = null, datetime_end = null, created_by_id }) {
  const sql = `
    INSERT INTO EVENT_SESSIONS (
      event_id,
      session_name,
      description,
      capacity,
      datetime_start,
      datetime_end,
      created_by_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const vals = [event_id, session_name, description, capacity, datetime_start, datetime_end, created_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findBySessionId(id) {
  const res = await query('SELECT * FROM EVENT_SESSIONS WHERE session_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByEventId(event_id) {
  const res = await query('SELECT * FROM EVENT_SESSIONS WHERE event_id = $1 ORDER BY session_id DESC', [event_id]);
  return res.rows;
}

async function removeBySessionById(id) {
  await query('DELETE FROM EVENT_SESSIONS WHERE session_id = $1', [id]);
  return true;
}

async function updateSessionById(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findBySessionId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE EVENT_SESSIONS SET ${sets} WHERE session_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

module.exports = { createSession, findBySessionId, listByEventId, removeBySessionById, updateSessionById };