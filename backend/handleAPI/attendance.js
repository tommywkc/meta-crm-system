const express = require('express');
const router = express.Router();

const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { findUserByQrToken, findByUserId } = require('../dao/usersDao');
const { findBySessionId } = require('../dao/eventSessionsDao');
const { findBySessionAndUser } = require('../dao/sessionRegistrationsDao');
const { createAttendance, findLatestByRegistrationId, updateStatusAndTouchTime } = require('../dao/eventAttendanceDao');
const { findPaymentsByUserAndEvent } = require('../dao/paymentsDao');

function computeAttendanceStatus(session) {
  // 規則：開始前 60 分鐘 ~ 結束後 30 分鐘：G；否則：R（使用目前時間）
  return computeAttendanceStatusForTime(session, new Date().toISOString());
}

function computeAttendanceStatusForTime(session, timeIso) {
  const time = timeIso ? new Date(timeIso) : new Date();
  const sessionStart = session?.datetime_start ? new Date(session.datetime_start) : null;
  const sessionEnd = session?.datetime_end ? new Date(session.datetime_end) : sessionStart;

  if (!sessionStart || Number.isNaN(sessionStart.getTime()) || Number.isNaN(time.getTime())) {
    // 若沒有可解析的開始時間或傳入時間格式錯誤，先回 R
    return 'R';
  }

  const windowStart = new Date(sessionStart.getTime() - 60 * 60 * 1000); // -60 mins
  const effectiveEnd = sessionEnd && !Number.isNaN(sessionEnd.getTime()) ? sessionEnd : sessionStart;
  const windowEnd = new Date(effectiveEnd.getTime() + 30 * 60 * 1000); // +30 mins

  return time >= windowStart && time <= windowEnd ? 'G' : 'R';
}

// 掃描或現場快速登記簽到：透過 qr_token 或 user_id 取得用戶，並以 session_id 完成簽到
router.post('/attendance/scan', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const { qr_token, session_id, user_id } = req.body || {};
    if (!session_id) {
      return res.status(400).json({ message: '缺少必要資料（session_id）' });
    }
    const sessionId = parseInt(session_id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: '無效的 session_id' });
    }

    const isQuickRegistration = Boolean(user_id && !qr_token);

    let user;
    if (qr_token) {
      user = await findUserByQrToken(qr_token);
      if (!user) {
        return res.status(404).json({ message: '無效的 QR Code 或用戶不存在' });
      }
    } else if (user_id) {
      const userId = parseInt(user_id, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ message: '無效的 user_id' });
      }
      user = await findByUserId(userId);
      if (!user) {
        return res.status(404).json({ message: '找不到指定的用戶' });
      }
    } else {
      return res.status(400).json({ message: '缺少必要資料（qr_token 或 user_id）' });
    }

    const session = await findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ message: '找不到指定的場次' });
    }

    const registration = await findBySessionAndUser(sessionId, user.user_id);
    if (!registration) {
      return res.status(400).json({ message: '此用戶尚未報名這個場次，無法簽到' });
    }

    // allow quick registration to pass an explicit attend_time (e.g., session datetime_start)
    const { attend_time } = req.body || {};

    // Fetch extra info for frontend display (Certificate, Special Note, Payment Status)
    const payments = await findPaymentsByUserAndEvent(user.user_id, session.event_id);
    const hasIssuedCertificate = payments.some(p => p.issued_certificate === true);
    const certificateNotIssued = !hasIssuedCertificate; 
    const paymentOutstanding = payments.some(p => p.status === 'OUTSTANDING');
    const specialNote = user.note_special || '';
    const extraInfo = { certificateNotIssued, specialNote, paymentOutstanding };

    const existingAttendance = await findLatestByRegistrationId(registration.registration_id);
    if (existingAttendance) {
      const s = String(existingAttendance.status || '').toUpperCase();
      if (s === 'G' || s === 'Y') {
        // Compute current attempt status (based on server time) so UI can distinguish old successful record vs current attempt validity
        const attemptStatus = computeAttendanceStatus(session);
        const msg = attemptStatus === 'G'
          ? `此用戶已成功簽到過（狀態 ${s}）`
          : `此用戶之前已簽到（狀態 ${s}），但目前簽到時間已超出範圍（目前狀態 ${attemptStatus}）`;
        return res.status(409).json({
          message: msg,
          attemptStatus,
          extraInfo,
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

      // If quick registration supplies attend_time or a scan supplies attend_time, compute status from that time and update
      if (isQuickRegistration && attend_time) {
        const computedStatus = computeAttendanceStatusForTime(session, attend_time);
        console.info('[attendance] quick-update:', { sessionStart: session.datetime_start, sessionEnd: session.datetime_end, now: new Date().toISOString(), attend_time, computedStatus });
        const updated = await updateStatusAndAttendTime(existingAttendance.attendance_id, computedStatus, attend_time);
        return res.status(200).json({
          extraInfo,
          message: computedStatus === 'G' ? '簽到成功' : '簽到已記錄（遲到/無效）',
          attendance: updated,
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

      const nextStatus = computeAttendanceStatus(session);
      console.info('[attendance] update-touch:', { sessionStart: session.datetime_start, sessionEnd: session.datetime_end, now: new Date().toISOString(), existingStatus: existingAttendance.status, nextStatus });
      const updated = await updateStatusAndTouchTime(existingAttendance.attendance_id, nextStatus);
      const responsePayload = {
        message: nextStatus === 'G'
          ? '簽到成功（由 R 更新為 G）'
          : '不在簽到時間範圍，已記錄為 R',
        extraInfo,
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
      };

      if (isQuickRegistration && nextStatus !== 'G') {
        return res.status(422).json({
          ...responsePayload,
          message: '目前不在簽到時間範圍，無法完成簽到',
        });
      }

      return res.status(nextStatus === 'G' ? 200 : 202).json(responsePayload);
    }

// Only accept an explicit attend_time for quick registration flows (manual/quick-created)
    if (isQuickRegistration && attend_time) {
      const computedStatus = computeAttendanceStatusForTime(session, attend_time);
      console.info('[attendance] quick-create:', { sessionStart: session.datetime_start, sessionEnd: session.datetime_end, now: new Date().toISOString(), attend_time, computedStatus });
      const attendance = await createAttendance({
        registration_id: registration.registration_id,
        status: computedStatus,
        attend_time: attend_time,
        remarks: null,
      });

      const createPayload = {
        message: computedStatus === 'G' ? '簽到成功（使用指定時間）' : '簽到已記錄（遲到/無效）',
        extraInfo,
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
      };

      return res.status(computedStatus === 'G' ? 201 : 202).json(createPayload);
    }

    const status = computeAttendanceStatus(session);
    console.info('[attendance] create:', { sessionStart: session.datetime_start, sessionEnd: session.datetime_end, now: new Date().toISOString(), status });
    const attendance = await createAttendance({
      registration_id: registration.registration_id,
      status,
      remarks: null,
    });
      
    const payload = {
      message: status === 'G' ? '簽到成功' : '不在簽到時間範圍，已記錄為 R',
      extraInfo,
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
    };

    if (isQuickRegistration && status !== 'G') {
      return res.status(422).json({
        ...payload,
        message: '目前不在簽到時間範圍，無法完成簽到',
      });
    }

    return res.status(status === 'G' ? 201 : 202).json(payload);
  } catch (error) {
    console.error('Attendance submission failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
