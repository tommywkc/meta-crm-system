const { query } = require('../db/pool');

async function createEvent({
  event_id = null,
  type,
  event_name,
  description = null,
  datetime_start = null,
  datetime_end = null,
  capacity = 60,
  remaining_seats = null,
  location = null,
  status = 'SCHEDULED',
  room_cost = null,
  speaker_id = null
}) {
  const sql = `
    INSERT INTO EVENTS (event_id, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;
  `;
  const vals = [event_id, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id];
  try {
    const res = await query(sql, vals);
    return res.rows[0];
  } catch (err) {
    console.error('DB insert failed:', err);
    throw err;
  }
}

async function findByEventId(id) {
  const res = await query('SELECT * FROM EVENTS WHERE event_id = $1', [id]);
  return res.rows[0] || null;
}

async function updateByEventId(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByEventId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE EVENTS SET ${sets} WHERE event_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function removeByEventId(id) {
  await query('DELETE FROM EVENTS WHERE event_id = $1', [id]);
  return true;
}

async function listbyEventsId(limit = 100, offset = 0) {
  const res = await query('SELECT * FROM EVENTS ORDER BY event_id ASC LIMIT $1 OFFSET $2', [limit, offset]);
  return res.rows;
}

async function findLatestEventId() {
  try {
    const sql = `SELECT MAX(event_id) AS latest_id FROM EVENTS;`;
    const { rows } = await query(sql);
    return rows[0]?.latest_id || null;
  } catch (err) {
    console.error(`Error finding latest ID in EVENTS:`, err);
    throw err;
  }
}

module.exports = { createEvent, findByEventId, updateByEventId, removeByEventId, listbyEventsId, findLatestEventId };