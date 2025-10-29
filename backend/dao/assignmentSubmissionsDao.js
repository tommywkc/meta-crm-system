const { query } = require('../db/pool');

async function createAssignmentSubmission({ assignment_id, user_id, submission_time = null, upload_id, status = 'SUBMITTED', graded_by_id = null, feedback = null }) {
  const sql = `INSERT INTO assignment_submissions (assignment_id, user_id, submission_time, upload_id, status, graded_by_id, feedback)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const vals = [assignment_id, user_id, submission_time, upload_id, status, graded_by_id, feedback];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findById(id) {
  const res = await query('SELECT * FROM assignment_submissions WHERE submission_id = $1', [id]);
  return res.rows[0] || null;
}

async function listByAssignment(assignment_id) {
  const res = await query('SELECT * FROM assignment_submissions WHERE assignment_id = $1 ORDER BY submission_id DESC', [assignment_id]);
  return res.rows;
}

async function removeAssignmentSubmissionById(id) {
  await query('DELETE FROM assignment_submissions WHERE submission_id = $1', [id]);
  return true;
}

module.exports = { createAssignmentSubmission, findById, listByAssignment, removeAssignmentSubmissionById };
