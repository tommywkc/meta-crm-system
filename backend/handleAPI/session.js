const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emptyToNull } = require('../function/dataSanitizer');
const { formatDateTime } = require('../function/dateFormatter');
const { createSession, listByEventId } = require('../dao/eventSessionsDao');

//handle get sessions by event_id
router.get('/events/:event_id/sessions', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const event_id = parseInt(req.params.event_id, 10);
    console.log('Received get sessions request for event:', event_id, 'from user:', req.user.sub);

    if (isNaN(event_id)) {
      return res.status(400).json({ message: '無效的活動 ID' });
    }

    const sessions = await listByEventId(event_id);
    
    // Format datetime fields for display
    const formattedSessions = sessions.map(s => ({
      ...s,
      datetime_start: s.datetime_start ? formatDateTime(s.datetime_start) : null,
      datetime_end: s.datetime_end ? formatDateTime(s.datetime_end) : null
    }));

    console.log(`Found ${sessions.length} sessions for event ${event_id}`);
    res.json({ sessions: formattedSessions });
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

module.exports = router;