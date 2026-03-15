const { query } = require('../db/pool');

async function createSuspension({ user_id, reason = null, start_time = null, end_time = null, created_by = 10000 }) {
  const sql = `
    INSERT INTO SUSPENSION (user_id, reason, start_time, end_time, created_by)
    VALUES ($1, COALESCE($2, NULL), COALESCE($3, CURRENT_TIMESTAMP), $4, $5)
    RETURNING *
  `;
  const vals = [user_id, reason, start_time, end_time, created_by];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function findLatestSuspensionByUserId(user_id) {
  const sql = `
    SELECT *
    FROM SUSPENSION
    WHERE user_id = $1
    ORDER BY start_time DESC, suspension_id DESC
    LIMIT 1
  `;
  const res = await query(sql, [user_id]);
  return res.rows[0] || null;
}

async function updateSuspensionById(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = keys.map((k) => fields[k]);
  vals.push(id);
  const sql = `UPDATE SUSPENSION SET ${sets} WHERE suspension_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

module.exports = {
  createSuspension,
  findLatestSuspensionByUserId,
  updateSuspensionById,
};
