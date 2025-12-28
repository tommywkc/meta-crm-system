const express = require('express');
const router = express.Router();

const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { findUserByQrToken } = require('../dao/usersDao');
const { findBySessionId } = require('../dao/eventSessionsDao');
const { findBySessionAndUser } = require('../dao/sessionRegistrationsDao');
const { createAttendance, findByRegistrationAndStatus } = require('../dao/eventAttendanceDao');

// 掃描簽到：使用 qr_token + session_id 完成以下流程：
// 1. 找出用戶
// 2. 檢查場次是否存在
// 3. 檢查是否已報名該場次
// 4. 若已報名，寫入 EVENT_ATTENDANCE 一筆出席記錄
router.post('/attendance/scan', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const { qr_token, session_id } = req.body || {};

    if (!qr_token || !session_id) {
      return res.status(400).json({ message: '缺少必要資料（qr_token 與 session_id）' });
    }

    const sessionId = parseInt(session_id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: '無效的 session_id' });
    }

    // 1. 以 QR Token 尋找用戶
    const user = await findUserByQrToken(qr_token);
    if (!user) {
      return res.status(404).json({ message: '無效的 QR Code 或用戶不存在' });
    }

    // 2. 確認場次存在
    const session = await findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ message: '找不到指定的場次' });
    }

    // 3. 檢查是否已報名該場次
    const registration = await findBySessionAndUser(sessionId, user.user_id);
    if (!registration) {
      return res.status(400).json({ message: '此用戶尚未報名這個場次，無法簽到' });
    }

    // 4. 檢查是否已經有狀態為 'G' 的簽到紀錄
    const existingGoodAttendance = await findByRegistrationAndStatus(registration.registration_id, 'G');
    if (existingGoodAttendance) {
      return res.status(409).json({
        message: '此用戶已完成簽到過（狀態 G）',
        attendance: existingGoodAttendance,
        user: {
          user_id: user.user_id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
        },
        session: {
          session_id: session.session_id,
          session_name: session.session_name,
          datetime_start: session.datetime_start,
        },
        registration: {
          registration_id: registration.registration_id,
          status: registration.status,
        },
      });
    }

    // 5. 寫入出席紀錄（留 registration_id，session_id/user_id 可由 JOIN 取得）
    const attendance = await createAttendance({
      registration_id: registration.registration_id,
      attend_time: null, // 使用 DB 預設 CURRENT_TIMESTAMP
      status: 'G',
      remarks: null,
    });

    return res.status(201).json({
      message: '簽到成功',
      attendance,
      user: {
        user_id: user.user_id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
      },
      session: {
        session_id: session.session_id,
        session_name: session.session_name,
        datetime_start: session.datetime_start,
      },
      registration: {
        registration_id: registration.registration_id,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error('Attendance scan failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
