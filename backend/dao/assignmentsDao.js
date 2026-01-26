// Assignments data access object (DAO)
const { query } = require('../db/pool');

async function createAssignment({ event_id, assigned_by_id, name = null, description = null, assigned_time = null, deadline = null }) {
  const sql = `INSERT INTO ASSIGNMENTS (event_id, assigned_by_id, name, description, assigned_time, deadline) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const vals = [event_id, assigned_by_id, name, description, assigned_time, deadline];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function updateAssignment(assignment_id, { name = null, description = null, deadline = null }) {
  const sql = `UPDATE ASSIGNMENTS SET name = $1, description = $2, deadline = $3 WHERE assignment_id = $4 RETURNING *`;
  const vals = [name, description, deadline, assignment_id];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByAssignmentId(id) {
  const res = await query('SELECT * FROM ASSIGNMENTS WHERE assignment_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByEventId(event_id) {
  const res = await query('SELECT * FROM ASSIGNMENTS WHERE event_id = $1 ORDER BY deadline ASC NULLS LAST, assignment_id DESC', [event_id]);
    return res.rows;
}

async function removeByAssignmentId(id) {
  await query('DELETE FROM ASSIGNMENTS WHERE assignment_id = $1', [id]);
  return true;
}

module.exports = { createAssignment, updateAssignment, findByAssignmentId, listByEventId, removeByAssignmentId };
