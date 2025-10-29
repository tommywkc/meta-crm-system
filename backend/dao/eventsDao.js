const { query } = require('../db/pool');

async function createEvent({ type, event_name, description = null, datetime_start = null, datetime_end = null, capacity = 60, location = null, status = 'SCHEDULED', room_cost = null, speaker_id = null }) {
  const sql = `INSERT INTO events (type, event_name, description, datetime_start, datetime_end, capacity, location, status, room_cost, speaker_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
  const vals = [type, event_name, description, datetime_start, datetime_end, capacity, location, status, room_cost, speaker_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByEventId(id) {
  const res = await query('SELECT * FROM events WHERE event_id = $1', [id]);
  return res.rows[0] || null;
}

async function updateEventById(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByEventId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE events SET ${sets} WHERE event_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function removeEventById(id) {
  await query('DELETE FROM events WHERE event_id = $1', [id]);
  return true;
}

async function listEvents(limit = 100, offset = 0) {
  const res = await query('SELECT * FROM events ORDER BY event_id DESC LIMIT $1 OFFSET $2', [limit, offset]);
  return res.rows;
}

module.exports = { createEvent, findByEventId, updateEventById, removeEventById, listEvents };