// Waitlist DAO — helpers for managing session waitlists and ranks
const { query } = require('../db/pool');

async function createWaitlist({ session_id, user_id, rank, created_by_id, create_time = null }) {
  const sql = `INSERT INTO WAITLIST (session_id, user_id, rank, created_by_id, create_time) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const vals = [session_id, user_id, rank, created_by_id, create_time];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByWaitlistId(id) {
  const res = await query('SELECT * FROM WAITLIST WHERE wait_id = $1', [id]);
  return res.rows[0] || null;
}

async function findByUserId(user_id) {
  const res = await query('SELECT * FROM WAITLIST WHERE user_id = $1 ORDER BY wait_id DESC', [user_id]);
  return res.rows;
}

async function listBySessionId(session_id) {
  const res = await query('SELECT * FROM WAITLIST WHERE session_id = $1 ORDER BY rank ASC', [session_id]);
  return res.rows;
}

// Update rank for a specific user
async function updateRankByUserId(user_id, new_rank) {
  const sql = `UPDATE WAITLIST SET rank = $1 WHERE user_id = $2 RETURNING *`;
  const vals = [new_rank, user_id];
  const res = await query(sql, vals);
  return res.rows;
}

// Update rank for user behind a specific user
async function updateRankBySessionIdAndRank(session_id, rank, new_rank) {
  const sql = `UPDATE waitlist SET rank = $1 WHERE session_id = $2 AND rank = $3 RETURNING *`;
  const vals = [new_rank, session_id, rank];
  const res = await query(sql, vals);
  return res.rows;
}

async function removeByWaitlistId(id) {
  await query('DELETE FROM waitlist WHERE wait_id = $1', [id]);
  return true;
}

async function removeByUserId(user_id) {
  await query('DELETE FROM waitlist WHERE user_id = $1', [user_id]);
  return true;
}

module.exports = { createWaitlist, findByWaitlistId, findByUserId, listBySessionId, removeByWaitlistId, removeByUserId ,updateRankByUserId, updateRankBySessionIdAndRank };