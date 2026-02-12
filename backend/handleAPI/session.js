const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emptyToNull } = require('../function/dataSanitizer');
const { createSession, listByEventId, findBySessionId, removeBySessionById, updateSessionById } = require('../dao/eventSessionsDao');
const {
  createRegistration,
  findBySessionAndUser,
  listUpcomingSessionsByUser,
  listUpcomingSessionsAllUsers,
  searchUpcomingSessionsByUser,
  searchUpcomingSessionsAllUsers,
  listSessionsByUserAndYear,
  listRegisteredSessionIdsByUserAndEvent,
  listAttendeesBySessionId,
} = require('../dao/sessionRegistrationsDao');
const { checkIsConfirmedEnrolled } = require('../dao/eventEnrollmentsDao');

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
      // 管理員 / 銷售 / 組長可看到全部人的尚未開始場次
      if (q && q.trim()) {
        sessions = await searchUpcomingSessionsAllUsers(limit, offset, q);
      } else {
        sessions = await listUpcomingSessionsAllUsers(limit, offset);
      }
    } else {
      return res.status(403).json({ message: '沒有權限查看場次報名列表' });
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

// Get all attendees for a specific session
router.get('/session-registrations/by-session', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const session_id = parseInt(req.query.session_id, 10);
    console.log('Received get session attendees request for session:', session_id, 'from user:', req.user.sub);

    if (isNaN(session_id)) {
      return res.status(400).json({ message: '無效的場次 ID' });
    }

    const attendees = await listAttendeesBySessionId(session_id);
    console.log(`Found ${attendees.length} attendees for session ${session_id}`);
    
    res.json({ users: attendees });
  } catch (error) {
    console.error('Get session attendees failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;