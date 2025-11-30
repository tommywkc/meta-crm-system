const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emptyToNull } = require('../function/dataSanitizer');
const { createSession, listByEventId, findBySessionId, removeBySessionById, updateSessionById } = require('../dao/eventSessionsDao');

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

    const newSession = {
      event_id: body.event_id,
      session_name: body.session_name,
      description: body.description || body.session_description || null,
      capacity: body.capacity != null ? body.capacity : (body.session_capacity != null ? parseInt(body.session_capacity, 10) : null),
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

module.exports = router;