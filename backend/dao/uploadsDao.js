const { query } = require('../db/pool');

async function createUpload(filename, fileLink, contentType) {
  const res = await query(
    'INSERT INTO UPLOADS (filename, file_link, content_type) VALUES ($1, $2, $3) RETURNING *',
    [filename, fileLink, contentType]
  );
  return res.rows[0];
}

async function findByUploadId(id) {
  const res = await query('SELECT * FROM UPLOADS WHERE upload_id = $1', [id]);
  return res.rows[0] || null;
}

async function removeByUploadId(id) {
  await query('DELETE FROM UPLOADS WHERE upload_id = $1', [id]);
  return true;
}

module.exports = { createUpload, findByUploadId, removeByUploadId };
