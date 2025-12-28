// Event sessions DAO — helpers for creating and managing event sessions
const { query } = require('../db/pool');

// Create a new session
// round 會根據同一活動與同一 session_name 的開始時間自動計算：
//   round = 1 + 已存在且 datetime_start 早於新場次的筆數
async function createSession({
  event_id,
  session_name,
  description = null,
  capacity = null,
  remaining_seats = null,
  datetime_start = null,
  datetime_end = null,
  created_by_id,
}) {
  // 先查出此活動、同名場次中，比這次開始時間早的場次數量
  const roundSql = `
    SELECT COALESCE(COUNT(*), 0) + 1 AS round
    FROM EVENT_SESSIONS es
    WHERE es.event_id = $1
      AND es.session_name = $2
      AND es.datetime_start < $3
  `;

  let round = 1;
  if (event_id != null && session_name && datetime_start) {
    const roundRes = await query(roundSql, [event_id, session_name, datetime_start]);
    if (roundRes.rows[0] && roundRes.rows[0].round != null) {
      round = Number(roundRes.rows[0].round) || 1;
    }
  }

  const sql = `
    INSERT INTO EVENT_SESSIONS (
      event_id,
      session_name,
      description,
      capacity,
      remaining_seats,
      datetime_start,
      datetime_end,
      round,
      created_by_id
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *
  `;

  const vals = [
    event_id,
    session_name,
    description,
    capacity,
    remaining_seats,
    datetime_start,
    datetime_end,
    round,
    created_by_id,
  ];

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
  // 若有更新 capacity 且呼叫端沒有明確指定 remaining_seats，
  // 則依照新容量調整剩餘位： new_cap - (old_cap - old_remaining)
  if (Object.prototype.hasOwnProperty.call(fields, 'capacity') &&
      !Object.prototype.hasOwnProperty.call(fields, 'remaining_seats')) {
    const existing = await findBySessionId(id);
    if (existing && existing.capacity != null && existing.remaining_seats != null) {
      const oldCap = Number(existing.capacity);
      const oldRemain = Number(existing.remaining_seats);
      const newCap = Number(fields.capacity);

      if (!Number.isNaN(oldCap) && !Number.isNaN(oldRemain) && !Number.isNaN(newCap)) {
        const used = oldCap - oldRemain; // 已使用名額
        let newRemain = newCap - used;   // 依照已使用名額計算新剩餘
        if (newRemain < 0) newRemain = 0; // 不讓剩餘小於 0
        fields.remaining_seats = newRemain;
      }
    }
  }

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