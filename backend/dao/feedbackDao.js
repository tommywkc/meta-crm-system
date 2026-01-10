const { query } = require('../db/pool');

async function createFeedback({ user_id, message, create_time = null }) {
  const sql = `INSERT INTO FEEDBACKS (submitted_by_id, text, submit_time) VALUES ($1,$2,$3) RETURNING *`;
  const vals = [user_id, message, create_time];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByFeedbackId(id) {
  const res = await query('SELECT * FROM FEEDBACKS WHERE feedback_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByFeedbackId(limit = 100) {
  const res = await query('SELECT * FROM FEEDBACKS ORDER BY feedback_id DESC LIMIT $1', [limit]);
  return res.rows;
}

module.exports = { createFeedback, findByFeedbackId, listByFeedbackId };