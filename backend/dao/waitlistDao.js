const { query } = require('../db/pool');

async function createWaitlistEntry({ session_id, user_id, rank, created_by_id, create_time = null }) {
  const sql = `INSERT INTO waitlist (session_id, user_id, rank, created_by_id, create_time) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const vals = [session_id, user_id, rank, created_by_id, create_time];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByWaitlistId(id) {
  const res = await query('SELECT * FROM waitlist WHERE wait_id = $1', [id]);
  return res.rows[0] || null;
}

async function listWaitlistBySessionId(session_id) {
  const res = await query('SELECT * FROM waitlist WHERE session_id = $1 ORDER BY rank ASC', [session_id]);
  return res.rows;
}

async function removeWaitlistById(id) {
  await query('DELETE FROM waitlist WHERE wait_id = $1', [id]);
  return true;
}

module.exports = { createWaitlistEntry, findByWaitlistId, listWaitlistBySessionId, removeWaitlistById };
