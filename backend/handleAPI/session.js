const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emptyToNull } = require('../function/dataSanitizer');
const { createSession, listByEventId, findBySessionId, removeBySessionById, updateSessionById } = require('../dao/eventSessionsDao');
const {
  createRegistration,
  findByRegistrationId,
  findBySessionAndUser,
  listUpcomingSessionsByUser,
  listUpcomingSessionsAllUsers,
  searchUpcomingSessionsByUser,
  listSessionsByUserAndYear,
  listRegisteredSessionIdsByUserAndEvent,
  listRegistrationsWithUserBySessionId,
  removeByRegistrationId,
} = require('../dao/sessionRegistrationsDao');
const { checkIsConfirmedEnrolled } = require('../dao/eventEnrollmentsDao');
const eventAttendanceDao = require('../dao/eventAttendanceDao');

//handle get sessions by event_id
router.get('/events/:event_id/sessions', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const event_id = parseInt(req.params.event_id, 10);
    console.log('Received get sessions request for event:', event_id, 'from user:', req.user.sub);

    if (isNaN(event_id)) {
      return res.status(400).json({ message: '無效的活動 ID' });
    }

    const sessions = await listByEventId(event_id);
    
    // Calculate duration_minutes, keep datetime in ISO format
    const processedSessions = sessions.map(s => {
      let duration_minutes = 60; // default
      if (s.datetime_start && s.datetime_end) {
        const start = new Date(s.datetime_start);
        const end = new Date(s.datetime_end);
        duration_minutes = Math.round((end - start) / (1000 * 60)); // difference in minutes
      }
      
      return {
        ...s,
        duration_minutes
        // datetime_start and datetime_end remain in ISO format
      };
    });

    console.log(`Found ${sessions.length} sessions for event ${event_id}`);
    res.json({ sessions: processedSessions });
  } catch (error) {
    console.error('Get sessions failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle create new session
router.post('/sessions', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    console.log('Received create session request from user:', req.user.sub, 'with data:', req.body);

    const body = emptyToNull(req.body);

    const startRaw = body.start_time || body.datetime_start;
    const endRaw = body.end_time || body.datetime_end;

    if (!body.session_name || !body.event_id || !startRaw || !endRaw) {
      return res.status(400).json({ message: '缺少必要的場次資料（需要 session_name, event_id, start/end 時間）' });
    }

    // Don't format datetime for database insertion - PostgreSQL accepts ISO 8601 directly
    const datetime_start = startRaw;
    const datetime_end = endRaw;

    if (body.capacity != null && parseInt(body.capacity, 10)) {
      remaining_seats = body.capacity;
    }else{
      remaining_seats = null;
    }


    

    const newSession = {
      event_id: body.event_id,
      session_name: body.session_name,
      description: body.description || body.session_description || null,
      capacity: body.capacity != null ? body.capacity : (body.session_capacity != null ? parseInt(body.session_capacity, 10) : null),
      remaining_seats: remaining_seats,
      datetime_start,
      datetime_end,
      created_by_id: req.user?.sub || null,
    };

    const createdSession = await createSession(newSession);
    console.log('Session created successfully:', createdSession);
    res.status(201).json({ message: '場次建立成功', session: createdSession });
  } catch (error) {
    console.error('Create session failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// handle get single session by id
router.get('/sessions/:id', authMiddleware, roleMiddleware(['admin','sales','leader','member']), async (req, res) => {
  try {
    const session_id = parseInt(req.params.id, 10);
    console.log('Received get single session request:', session_id, 'from user:', req.user.sub);
    if (isNaN(session_id)) {
      return res.status(400).json({ message: '無效的場次 ID' });
    }
    const session = await findBySessionId(session_id);
    if (!session) {
      return res.status(404).json({ message: '場次不存在' });
    }
    let duration_minutes = null;
    if (session.datetime_start && session.datetime_end) {
      duration_minutes = Math.round((new Date(session.datetime_end) - new Date(session.datetime_start)) / (1000*60));
    }
    res.json({ session: { ...session, duration_minutes } });
  } catch (error) {
    console.error('Get single session failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle update session by id
router.put('/sessions/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const session_id = parseInt(req.params.id, 10);
    const updateData = emptyToNull(req.body);
    console.log('Received session update request:', session_id, 'from user:', req.user.sub);

    const existingSession = await findBySessionId(session_id);
    if (!existingSession) {
      return res.status(404).json({ message: '場次不存在' });
    }

    const updated = await updateSessionById(session_id, updateData);

    console.log('Successfully updated session data:', session_id);
    res.json({ message: '場次資料更新成功', session: updated });
  } catch (error) {
    console.error('Failed to update session data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle delete session by id
router.delete('/sessions/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const session_id = parseInt(req.params.id, 10);
    console.log('Received delete session request:', session_id, 'from user:', req.user.sub);

    const existingSession = await findBySessionId(session_id);
    if (!existingSession) {
      return res.status(404).json({ message: '場次不存在' });
    }

    await removeBySessionById(session_id);
    console.log('Successfully deleted session:', session_id);
    res.json({ message: '場次資料刪除成功' });
  } catch (error) {
    console.error('Failed to delete session:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Create a new session registration
router.post('/session-registrations', authMiddleware, async (req, res) => {
  try {
    const { session_id, user_id, registration_by_id, channel } = req.body || {};

    if (!session_id || !user_id) {
      return res.status(400).json({ message: '缺少必要的場次報名資料（需要 session_id 和 user_id）' });
    }

    const sessionId = parseInt(session_id, 10);
    const userId = parseInt(user_id, 10);
    if (isNaN(sessionId) || isNaN(userId)) {
      return res.status(400).json({ message: '無效的 session_id 或 user_id' });
    }

    // 先確認場次是否存在，並取得對應的 event_id
    const session = await findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ message: '場次不存在' });
    }

    const eventId = session.event_id;
    if (!eventId) {
      return res.status(400).json({ message: '此場次沒有對應活動，無法進行場次報名' });
    }

    // 確認使用者已確認報名該活動，才允許場次報名
    const isEnrolled = await checkIsConfirmedEnrolled(userId, eventId);
    if (!isEnrolled) {
      return res.status(400).json({ message: '使用者尚未報名此場次所屬的活動，無法進行場次報名' });
    }

    // Prevent duplicate registrations for the same session and user
    const existing = await findBySessionAndUser(sessionId, userId);
    if (existing) {
      return res.status(400).json({ message: '已報名此場次' });
    }

    const registrationById = registration_by_id || req.user.sub;

    // Normalize channel to values allowed by CHKCHANNEL_REG in DB (currently WHATSAPP, SALES, WEB)
    // 自己幫自己報名一律視為 WEB 線上報名
    let channelValue;
    if (registrationById && registrationById === userId) {
      // 自己幫自己報名 → 一律視為 WEB 線上報名
      channelValue = 'WEB';
    } else {
      switch (channel) {
        case 'WHATSAPP':
        case 'SALES':
        case 'LEADER':
        case 'WEB':
          channelValue = channel;
          break;
        default:
          // 任何未知或未填的 channel 一律當作 WEB，避免撞到 DB constraint
          channelValue = 'WEB';
          break;
      }
    }

    remaining_seats = session.remaining_seats;
    if (remaining_seats <= 0. && remaining_seats != null) {
      return res.status(400).json({ message: '此場次已無剩餘名額，無法報名' });
    }else if (remaining_seats != null) {
      // 減少剩餘名額
      remaining_seats -= 1;
      await updateSessionById(sessionId, { remaining_seats });
    }

    const registration = await createRegistration({
      session_id: sessionId,
      user_id: userId,
      channel: channelValue,
      registration_by_id: registrationById,

    });

    return res.status(201).json({
      message: '場次報名成功！',
      registration,
    });
  } catch (error) {
    console.error('Create session registration failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get upcoming sessions for current user (next N sessions)
router.get('/my-sessions/upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit, 10) || 5;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }

    const sessions = await listUpcomingSessionsByUser(userId, limit, offset);

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get upcoming sessions for current user failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get upcoming enrolled sessions list (not finished), role-based:
// - MEMBER: only own sessions
// - ADMIN/SALES/LEADER: all sessions
router.get('/session-registrations/enrolled-upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const role = (req.user.role || '').toUpperCase();
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    const q = req.query.q || '';
    const userIdParam = req.query.user_id ? String(req.query.user_id).trim() : '';
    const eventIdParam = req.query.event_id;
    const eventIdNum = eventIdParam ? parseInt(eventIdParam, 10) : null;

    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }

    let sessions = [];
    if (role === 'MEMBER') {
      // 會員只可看到自己的尚未開始場次
      if (q && q.trim()) {
        sessions = await searchUpcomingSessionsByUser(userId, limit, offset, q);
      } else {
        sessions = await listUpcomingSessionsByUser(userId, limit, offset);
      }
    } else if (['ADMIN', 'SALES', 'LEADER'].includes(role)) {
      if (userIdParam) {
        sessions = await searchUpcomingSessionsByUser(userIdParam, limit, offset, q);
      } else {
        sessions = await listUpcomingSessionsAllUsers(limit, offset);
      }
    } else {
      return res.status(403).json({ message: '沒有權限查看場次報名列表' });
    }

    // Optional filter by event_id when provided
    if (eventIdNum) {
      sessions = sessions.filter((s) => Number(s.event_id) === eventIdNum);
    }

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get enrolled-upcoming sessions list failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get all sessions for current user within a specific year (for calendar view)
router.get('/my-sessions/by-year', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const yearParam = req.query.year;
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }
    if (!year || Number.isNaN(year)) {
      return res.status(400).json({ message: '無效的年度參數' });
    }

    const sessions = await listSessionsByUserAndYear(userId, year);

    return res.status(200).json({ sessions, year });
  } catch (error) {
    console.error('Get sessions by year for current user failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get session_ids that current user has registered for a specific event
router.get('/my-sessions/registered-by-event', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { event_id } = req.query;
    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }
    if (!event_id) {
      return res.status(400).json({ message: '缺少活動 ID（event_id）' });
    }
    const eventIdNum = parseInt(event_id, 10);
    if (Number.isNaN(eventIdNum)) {
      return res.status(400).json({ message: '無效的活動 ID' });
    }

    const rows = await listRegisteredSessionIdsByUserAndEvent(userId, eventIdNum);
    const sessionIds = rows.map((r) => r.session_id).filter((id) => id != null);

    return res.status(200).json({ sessionIds });
  } catch (error) {
    console.error('Get registered session IDs by event for current user failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// --- Admin/Staff: get upcoming sessions for a specific user (limit)
router.get('/session-registrations/user/:user_id/upcoming', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const userIdParam = parseInt(req.params.user_id, 10);
    if (Number.isNaN(userIdParam)) return res.status(400).json({ message: '無效的 user_id' });

    // members can only fetch their own upcoming sessions
    const role = (req.user.role || '').toUpperCase();
    if (role === 'MEMBER' && Number(req.user.sub) !== Number(userIdParam)) {
      return res.status(403).json({ message: '沒有權限' });
    }

    const limit = parseInt(req.query.limit, 10) || 5;
    const sessions = await listUpcomingSessionsByUser(userIdParam, limit, 0);
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get user upcoming sessions failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// --- Admin/Staff: get sessions for a specific user by year
router.get('/session-registrations/user/:user_id/sessions-by-year', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const userIdParam = parseInt(req.params.user_id, 10);
    if (Number.isNaN(userIdParam)) return res.status(400).json({ message: '無效的 user_id' });

    const role = (req.user.role || '').toUpperCase();
    if (role === 'MEMBER' && Number(req.user.sub) !== Number(userIdParam)) {
      return res.status(403).json({ message: '沒有權限' });
    }

    const year = parseInt(req.query.year, 10) || (new Date()).getFullYear();
    const sessions = await listSessionsByUserAndYear(userIdParam, year);
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get user sessions by year failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// helper: compute status for a given time (same rules as attendance handler)
function computeAttendanceStatusForTime(session, timeIso) {
  const time = timeIso ? new Date(timeIso) : new Date();
  const sessionStart = session?.datetime_start ? new Date(session.datetime_start) : null;
  const sessionEnd = session?.datetime_end ? new Date(session.datetime_end) : sessionStart;

  if (!sessionStart || Number.isNaN(sessionStart.getTime()) || Number.isNaN(time.getTime())) {
    return 'R';
  }

  const windowStart = new Date(sessionStart.getTime() - 60 * 60 * 1000); // -60 mins
  const effectiveEnd = sessionEnd && !Number.isNaN(sessionEnd.getTime()) ? sessionEnd : sessionStart;
  const windowEnd = new Date(effectiveEnd.getTime() + 30 * 60 * 1000); // +30 mins
  return time >= windowStart && time <= windowEnd ? 'G' : 'R';
}

// Manual check-in: POST /api/session-registrations/:id/checkin
router.post('/session-registrations/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: '無效的 registration_id' });
    }

    const registration = await findByRegistrationId(registrationId);
    if (!registration) {
      return res.status(404).json({ message: '報名紀錄不存在' });
    }

    // determine if caller explicitly requested manual check-in (use session time)
    const manualFlag = (req.body && req.body.manual === true) || (req.query && String(req.query.manual) === 'true');
    let sessionTime = null;
    let computedStatus = null;
    if (manualFlag && registration && registration.session_id) {
      const session = await findBySessionId(registration.session_id);
      sessionTime = session?.datetime_start || null;
      computedStatus = computeAttendanceStatusForTime(session, sessionTime);
    }

    // Check for latest existing attendance record (any status)
    const latestAtt = await eventAttendanceDao.findLatestByRegistrationId(registrationId);

    if (latestAtt) {
      // If manual attempt: do NOT downgrade an existing successful G/Y record — return attemptStatus instead
      const currentStatus = String(latestAtt.status || '').toUpperCase();
      if (manualFlag) {
        if (currentStatus === 'G' || currentStatus === 'Y') {
          // compute attempt status for the manual attempt but keep existing record unchanged
          const attemptStatus = computedStatus || 'R';
          const msg = attemptStatus === 'G'
            ? `此用戶已成功簽到過（狀態 ${currentStatus}）`
            : `此用戶之前已簽到（狀態 ${currentStatus}），但目前簽到時間已超出範圍（目前狀態 ${attemptStatus}）`;
          return res.status(409).json({ message: msg, attemptStatus, attendance: latestAtt, session: { session_id: registration.session_id } });
        }

        // Otherwise update the latest non-success record with computedStatus and sessionTime
        const updated = await eventAttendanceDao.updateStatusAndAttendTime(latestAtt.attendance_id, computedStatus || latestAtt.status, sessionTime);
        if (computedStatus && computedStatus !== 'G') {
          return res.status(422).json({ message: '目前不在簽到時間範圍，無法完成簽到', attendance: updated, attemptStatus: computedStatus });
        }
        return res.status(200).json({ message: '已簽到', attendance: updated });
      }

      // Non-manual behavior: if latest is G/Y treat as already signed; otherwise touch timestamp to latest
      if (currentStatus === 'G' || currentStatus === 'Y') {
        const updated = await eventAttendanceDao.updateStatusAndTouchTime(latestAtt.attendance_id, latestAtt.status);
        return res.status(200).json({ message: '已簽到', attendance: updated });
      }
      // if latest exists but not G/Y, we'll create a new attendance (non-manual)
    }

    // Otherwise create a new attendance record; for manualFlag use computedStatus, otherwise default to 'G'
    const statusToWrite = manualFlag ? (computedStatus || 'R') : 'G';
    const newAtt = await eventAttendanceDao.createAttendance({ registration_id: registrationId, status: statusToWrite, attend_time: sessionTime });

    if (manualFlag && computedStatus && computedStatus !== 'G') {
      return res.status(422).json({ message: '目前不在簽到時間範圍，無法完成簽到', attendance: newAtt, attemptStatus: computedStatus });
    }

    return res.status(statusToWrite === 'G' ? 201 : 202).json({ message: '簽到成功', attendance: newAtt });
  } catch (error) {
    console.error('Manual check-in failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Cancel check-in: DELETE /api/session-registrations/:id/checkin
router.delete('/session-registrations/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: '無效的 registration_id' });
    }

    const registration = await findByRegistrationId(registrationId);
    if (!registration) {
      return res.status(404).json({ message: '報名紀錄不存在' });
    }

    // Find latest 'G' or 'Y' attendance record
    let att = await eventAttendanceDao.findByRegistrationAndStatus(registrationId, 'G');
    if (!att) att = await eventAttendanceDao.findByRegistrationAndStatus(registrationId, 'Y');
    if (!att) {
      return res.status(404).json({ message: '未有出席紀錄' });
    }

    await eventAttendanceDao.removeByAttendanceId(att.attendance_id);
    return res.status(200).json({ message: '已取消簽到' });
  } catch (error) {
    console.error('Cancel check-in failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get latest attendance for a registration: GET /api/session-registrations/:id/attendance
router.get('/session-registrations/:id/attendance', authMiddleware, async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (Number.isNaN(registrationId)) return res.status(400).json({ message: '無效的 registration_id' });
    const att = await eventAttendanceDao.findLatestByRegistrationId(registrationId);
    if (!att) return res.status(404).json({ message: '未有出席紀錄' });
    return res.status(200).json({ attendance: att });
  } catch (error) {
    console.error('Get registration attendance failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// List all attendees (users) for a specific session
router.get('/session-registrations/by-session', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ message: '缺少場次 ID（session_id）' });
    }

    const sessionIdNum = parseInt(session_id, 10);
    if (Number.isNaN(sessionIdNum)) {
      return res.status(400).json({ message: '無效的場次 ID' });
    }

    const rows = await listRegistrationsWithUserBySessionId(sessionIdNum);
    const users = rows.map((r) => ({
      registration_id: r.registration_id,
      user_id: r.user_id,
      name: r.name,
      role: r.role,
      mobile: r.mobile,
      email: r.email,
      channel: r.channel,
      status: r.status,
      registration_time: r.registration_time,
      attendance_status: r.attendance_status,
      attendance_time: r.attendance_time || r.attend_time || null,
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('List session attendees by session failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Delete a session registration by registration_id
router.delete('/session-registrations/:id', authMiddleware, async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: '無效的 registration_id' });
    }

    await removeByRegistrationId(registrationId);
    return res.status(200).json({ message: '場次報名已刪除' });
  } catch (error) {
    console.error('Delete session registration failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;