const express = require('express');
const router = express.Router();

const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { findUserByQrToken } = require('../dao/usersDao');
const { findBySessionId } = require('../dao/eventSessionsDao');
const { findBySessionAndUser } = require('../dao/sessionRegistrationsDao');
const { createAttendance, findLatestByRegistrationId, updateStatusAndTouchTime } = require('../dao/eventAttendanceDao');

function computeAttendanceStatus(session) {
  // 規則：開始前 60 分鐘 ~ 結束後 30 分鐘：G；否則：R
  const now = new Date();
  const sessionStart = session?.datetime_start ? new Date(session.datetime_start) : null;
  const sessionEnd = session?.datetime_end ? new Date(session.datetime_end) : sessionStart;

  if (!sessionStart || Number.isNaN(sessionStart.getTime())) {
    // 若沒有可解析的開始時間，先回 R（避免誤判為有效簽到）
    return 'R';
  }

  const windowStart = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  const effectiveEnd = sessionEnd && !Number.isNaN(sessionEnd.getTime()) ? sessionEnd : sessionStart;
  const windowEnd = new Date(effectiveEnd.getTime() + 30 * 60 * 1000);

  return now >= windowStart && now <= windowEnd ? 'G' : 'R';
}

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

    // 4. 查詢是否已有出席紀錄
    const existingAttendance = await findLatestByRegistrationId(registration.registration_id);

    // 4.1 若已有紀錄：
    //   - status = G 或 Y：不需變更
    //   - status = R：依時間窗重新計算並更新
    if (existingAttendance) {
      const s = String(existingAttendance.status || '').toUpperCase();
      if (s === 'G' || s === 'Y') {
        return res.status(409).json({
          message: `此用戶已成功簽到過（狀態 ${s}）`,
          attendance: existingAttendance,
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
            datetime_end: session.datetime_end,
          },
          registration: {
            registration_id: registration.registration_id,
            status: registration.status,
          },
        });
      }

      // status = R（或其他/空值）：依規則重新計算
      const nextStatus = computeAttendanceStatus(session);
      const updated = await updateStatusAndTouchTime(existingAttendance.attendance_id, nextStatus);

      return res.status(200).json({
        message: nextStatus === 'G'
          ? '簽到成功（由 R 更新為 G）'
          : '不在簽到時間範圍，已記錄為 R',
        attendance: updated || existingAttendance,
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
          datetime_end: session.datetime_end,
        },
        registration: {
          registration_id: registration.registration_id,
          status: registration.status,
        },
      });
    }

    // 4.2 若沒有紀錄：依時間窗計算狀態後新增
    const status = computeAttendanceStatus(session);


    // 5. 建立簽到記錄
    const attendance = await createAttendance({
      registration_id: registration.registration_id,
      status: status,
      remarks: null,
    });

    return res.status(201).json({
      message: status === 'G' ? '簽到成功' : '不在簽到時間範圍，已記錄為 R',
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
        datetime_end: session.datetime_end,
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
