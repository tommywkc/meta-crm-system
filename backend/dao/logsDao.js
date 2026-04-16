const { query } = require('../db/pool');

async function createLog({ user_id = null, action, details = null }) {
  const sql = `
    INSERT INTO LOGS (user_id, action, details)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const res = await query(sql, [user_id, action, details]);
  return res.rows[0] || null;
}

async function listLogs({ action = null, limit = 100, offset = 0 } = {}) {
  const sql = `
    SELECT *
    FROM LOGS
    WHERE ($1::text IS NULL OR action = $1)
    ORDER BY log_time DESC, log_id DESC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [action, limit, offset]);
  return res.rows || [];
}

module.exports = {
  createLog,
  listLogs,
};
