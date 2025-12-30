// Event attendance DAO — helpers for recording and querying attendance
const { query } = require('../db/pool');

async function createAttendance({ registration_id, attend_time = null, status = null, remarks = null }) {
  // 若 attend_time 未提供，使用 DB 的 CURRENT_TIMESTAMP（避免寫入 NULL 覆蓋欄位預設）
  const sql = `
    INSERT INTO EVENT_ATTENDANCE (registration_id, attend_time, status, remarks)
    VALUES ($1, COALESCE($2, CURRENT_TIMESTAMP), $3, $4)
    RETURNING *
  `;
  const vals = [registration_id, attend_time, status, remarks];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByAttendanceId(id) {
  const res = await query('SELECT * FROM EVENT_ATTENDANCE WHERE attendance_id = $1', [id]);
  return res.rows[0] || null;
}

// 依 registration_id 與狀態查詢是否已有出席紀錄
async function findByRegistrationAndStatus(registration_id, status) {
  const res = await query(
    'SELECT * FROM EVENT_ATTENDANCE WHERE registration_id = $1 AND status = $2 ORDER BY attend_time DESC LIMIT 1',
    [registration_id, status]
  );
  return res.rows[0] || null;
}

// 依 registration_id 取得最新一筆出席紀錄（不論狀態）
async function findLatestByRegistrationId(registration_id) {
  const res = await query(
    'SELECT * FROM EVENT_ATTENDANCE WHERE registration_id = $1 ORDER BY attend_time DESC LIMIT 1',
    [registration_id]
  );
  return res.rows[0] || null;
}

// 更新狀態並刷新簽到時間（以最新掃描時間為準）
async function updateStatusAndTouchTime(attendance_id, status) {
  const res = await query(
    'UPDATE EVENT_ATTENDANCE SET status = $2, attend_time = CURRENT_TIMESTAMP WHERE attendance_id = $1 RETURNING *',
    [attendance_id, status]
  );
  return res.rows[0] || null;
}

async function removeByAttendanceId(id) {
  await query('DELETE FROM EVENT_ATTENDANCE WHERE attendance_id = $1', [id]);
  return true;
}
module.exports = {
  createAttendance,
  findByAttendanceId,
  findByRegistrationAndStatus,
  findLatestByRegistrationId,
  updateStatusAndTouchTime,
  removeByAttendanceId,
};
