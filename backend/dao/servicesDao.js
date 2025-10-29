const { query } = require('../db/pool');

async function createService({ service_name, description = null, price = null, create_time = null, created_by_id = null }) {
  const sql = `INSERT INTO services (service_name, description, price, create_time, created_by_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const vals = [service_name, description, price, create_time, created_by_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByServiceId(id) {
  const res = await query('SELECT * FROM services WHERE service_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByServiceId(limit = 100) {
  const res = await query('SELECT * FROM services ORDER BY service_id DESC LIMIT $1', [limit]);
  return res.rows;
}

async function removeByServiceId(id) {
  await query('DELETE FROM services WHERE service_id = $1', [id]);
  return true;
}

module.exports = { createService, findByServiceId, listByServiceId, removeByServiceId };
