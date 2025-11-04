// Assignments data access object (DAO)
const { query } = require('../db/pool');

async function createAssignment({ session_id, assigned_by_id, assigned_time = null, deadline = null }) {
  const sql = `INSERT INTO ASSIGNMENTS (session_id, assigned_by_id, assigned_time, deadline) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [session_id, assigned_by_id, assigned_time, deadline];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByAssignmentId(id) {
  const res = await query('SELECT * FROM ASSIGNMENTS WHERE assignment_id = $1', [id]);
  return res.rows[0] || null;
}

async function listBySessionId(session_id) {
    const res = await query('SELECT * FROM ASSIGNMENTS WHERE session_id = $1 ORDER BY assignment_id DESC', [session_id]);
    return res.rows;
}

async function removeByAssignmentId(id) {
  await query('DELETE FROM ASSIGNMENTS WHERE assignment_id = $1', [id]);
  return true;
}

module.exports = { createAssignment, findByAssignmentId, listBySessionId, removeByAssignmentId };
