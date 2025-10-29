const { query } = require('../db/pool');

async function createUpload({ filename, content = null, content_type = null, upload_time = null }) {
  const sql = `INSERT INTO uploads (filename, content, content_type, upload_time) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [filename, content, content_type, upload_time];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM uploads WHERE upload_id = $1', [id]);
  return res.rows[0] || null;
}

async function removeUploadById(id) {
  await query('DELETE FROM uploads WHERE upload_id = $1', [id]);
  return true;
}

module.exports = { createUpload, findById, removeUploadById };
