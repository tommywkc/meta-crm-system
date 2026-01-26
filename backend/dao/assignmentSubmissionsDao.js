// Assignment submissions DAO — database helpers for assignment submissions
const { query } = require('../db/pool');

async function createSubmission({ assignment_id, user_id, submission_time = null, upload_id, status = 'SUBMITTED', graded_by_id = null, feedback = null }) {
  const sql = `INSERT INTO ASSIGNMENT_SUBMISSIONS (assignment_id, user_id, submission_time, upload_id, status, graded_by_id, feedback)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const vals = [assignment_id, user_id, submission_time, upload_id, status, graded_by_id, feedback];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findBySubmissionId(id) {
  const res = await query('SELECT * FROM ASSIGNMENT_SUBMISSIONS WHERE submission_id = $1', [id]);
  return res.rows[0] || null;
}

async function findByAssignmentAndUser(assignment_id, user_id) {
  const res = await query(
    'SELECT * FROM ASSIGNMENT_SUBMISSIONS WHERE assignment_id = $1 AND user_id = $2 ORDER BY submission_id DESC LIMIT 1',
    [assignment_id, user_id]
  );
  return res.rows[0] || null;
}

async function listByAssignmentId(assignment_id) {
  const res = await query('SELECT * FROM ASSIGNMENT_SUBMISSIONS WHERE assignment_id = $1 ORDER BY submission_id DESC', [assignment_id]);
  return res.rows;
}

async function removeBySubmissionId(id) {
  await query('DELETE FROM ASSIGNMENT_SUBMISSIONS WHERE submission_id = $1', [id]);
  return true;
}

async function updateGradeByAssignmentUser(assignment_id, user_id, { score = null, feedback = null, graded_by_id = null }) {
  const sql = `
    UPDATE ASSIGNMENT_SUBMISSIONS
    SET score = $1,
        feedback = $2,
        graded_by_id = $3
    WHERE assignment_id = $4 AND user_id = $5
    RETURNING *
  `;
  const vals = [score, feedback, graded_by_id, assignment_id, user_id];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function updateSubmissionTimeByAssignmentUser(assignment_id, user_id, submission_time = null) {
  const sql = `
    UPDATE ASSIGNMENT_SUBMISSIONS
    SET submission_time = $1
    WHERE assignment_id = $2 AND user_id = $3
    RETURNING *
  `;
  const vals = [submission_time, assignment_id, user_id];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

module.exports = { createSubmission, findBySubmissionId, findByAssignmentAndUser, listByAssignmentId, removeBySubmissionId, updateGradeByAssignmentUser, updateSubmissionTimeByAssignmentUser };
