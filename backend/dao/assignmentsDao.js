const { query } = require('../db/pool');

async function createAssignment({ session_id, assigned_by_id, assigned_time = null, deadline = null }) {
  const sql = `INSERT INTO assignments (session_id, assigned_by_id, assigned_time, deadline) VALUES ($1,$2,$3,$4) RETURNING *`;
  const vals = [session_id, assigned_by_id, assigned_time, deadline];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM assignments WHERE assignment_id = $1', [id]);
  return res.rows[0] || null;
}

async function removeAssignmentById(id) {
  await query('DELETE FROM assignments WHERE assignment_id = $1', [id]);
  return true;
}

module.exports = { createAssignment, findById, removeAssignmentById };
