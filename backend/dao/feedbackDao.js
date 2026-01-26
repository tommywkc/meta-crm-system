const { query } = require('../db/pool');

async function createFeedback({ user_id, testing_role = null, rating, message }) {
  const sql = `INSERT INTO FEEDBACKS (submitted_by_id, testing_role, rating, text) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [user_id, testing_role, rating, message];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByFeedbackId(id) {
  const res = await query('SELECT * FROM FEEDBACKS WHERE feedback_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByFeedbackId(limit = 100, offset = 0) {
  const res = await query('SELECT * FROM FEEDBACKS ORDER BY feedback_id DESC LIMIT $1 OFFSET $2', [limit, offset]);
  return res.rows;
}

module.exports = { createFeedback, findByFeedbackId, listByFeedbackId };