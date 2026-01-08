// Events data access object (DAO)
const { query } = require('../db/pool');

async function createEvent({
  event_id = null,
  type,
  price = null,
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
    INSERT INTO EVENTS (event_id, price, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *;
  `;
  const vals = [event_id, price, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id];
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

async function findEventByStatus(status) {
  const res = await query('SELECT * FROM EVENTS WHERE status = $1', [status]);
  return res.rows;
}

//for whatsapp////
async function findOpenFreeSeminars() {
  const sql = `
    SELECT event_id, event_name, datetime_start, datetime_end, capacity, remaining_seats
    FROM EVENTS
    WHERE type = 'SEMINAR'
      AND status = 'OPEN'
      AND (price IS NULL OR price = 0)
    ORDER BY datetime_start ASC NULLS LAST, event_id ASC
  `;
  const res = await query(sql);
  return res.rows;
}
////////////////

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

async function searchEvents(limit = 100, offset = 0, q = '') {
  if (!q || !q.trim()) return listbyEventsId(limit, offset);
  const pattern = `%${q}%`;
  const sql = `
    SELECT * FROM EVENTS
    WHERE CAST(event_id AS TEXT) ILIKE $3
       OR event_name ILIKE $3
       OR type ILIKE $3
       OR status ILIKE $3
    ORDER BY event_id ASC
    LIMIT $1 OFFSET $2
  `;
  const res = await query(sql, [limit, offset, pattern]);
  return res.rows;
}

async function searchEventsByStatus(status, limit = 100, offset = 0, q = '') {
  const pattern = q && q.trim() ? `%${q}%` : null;
  if (!pattern) {
    const sql = `SELECT * FROM EVENTS WHERE status = $1 ORDER BY event_id ASC LIMIT $2 OFFSET $3`;
    const res = await query(sql, [status, limit, offset]);
    return res.rows;
  }

  const sql = `
    SELECT * FROM EVENTS
    WHERE status = $1
      AND (
        CAST(event_id AS TEXT) ILIKE $4
        OR event_name ILIKE $4
        OR type ILIKE $4
        OR status ILIKE $4
      )
    ORDER BY event_id ASC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [status, limit, offset, pattern]);
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

async function updateRemainingSeats(event_id, change) {
  const eventData = await findByEventId(event_id);
  if (!eventData) {
    throw new Error(`Event with ID ${event_id} not found`);
  }
  let newRemainingSeats = eventData.remaining_seats + change;
  
  const sql = `UPDATE EVENTS SET remaining_seats = $1 WHERE event_id = $2 RETURNING *`;
  const vals = [newRemainingSeats, event_id];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

module.exports = { createEvent, findByEventId, updateByEventId, removeByEventId, listbyEventsId, findLatestEventId, findEventByStatus, updateRemainingSeats, searchEvents, searchEventsByStatus };
