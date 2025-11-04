// Notices DAO — create and retrieve notice records
const { query } = require('../db/pool');

async function createNotice({ title, content, target_role = null, create_time = null, created_by_id }) {
  const sql = `INSERT INTO NOTICES (title, content, target_role, create_time, created_by_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const vals = [title, content, target_role, create_time, created_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByNoticeId(id) {
  const res = await query('SELECT * FROM NOTICES WHERE notice_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByNoticeId(limit = 50) {
  const res = await query('SELECT * FROM NOTICES ORDER BY notice_id DESC LIMIT $1', [limit]);
  return res.rows;
}

async function removeByNoticeId(id) {
  await query('DELETE FROM NOTICES WHERE notice_id = $1', [id]);
  return true;
}

module.exports = { createNotice, findByNoticeId, listByNoticeId, removeByNoticeId };
