const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emptyToNull } = require('../function/dataSanitizer');
const { createSession } = require('../dao/eventSessionsDao');

// Create single event session
// Body: { event_id, session_name, description?, datetime_start, datetime_end }
router.post('/event-sessions', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const body = emptyToNull(req.body || {});
    console.log('Received create event session request by user:', req.user.sub, '->', body);

    const { event_id, session_name, description = null, datetime_start = null, datetime_end = null } = body;
    if (!event_id || !session_name || !datetime_start || !datetime_end) {
      return res.status(400).json({ message: '缺少必要的場次資料（event_id, session_name, datetime_start, datetime_end）' });
    }

    const created = await createSession({
      event_id,
      session_name,
      description,
      datetime_start,
      datetime_end,
      created_by_id: req.user.sub,
    });
    return res.status(201).json({ message: '場次建立成功', session: created });
  } catch (error) {
    console.error('Create event session failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Bulk create event sessions
// Body: { event_id?, sessions: [{ event_id?, session_name, description?, datetime_start, datetime_end }] }
router.post('/event-sessions/bulk', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const body = req.body || {};
    const { event_id: bodyEventId = null, sessions = [] } = body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ message: 'sessions 陣列不可為空' });
    }

    const results = [];
    for (const s of sessions) {
      const one = emptyToNull(s || {});
      const finalEventId = one.event_id || bodyEventId;
      if (!finalEventId || !one.session_name || !one.datetime_start || !one.datetime_end) {
        return res.status(400).json({ message: '每筆場次需包含 event_id, session_name, datetime_start, datetime_end' });
      }
      const created = await createSession({
        event_id: finalEventId,
        session_name: one.session_name,
        description: one.description || null,
        datetime_start: one.datetime_start,
        datetime_end: one.datetime_end,
        created_by_id: req.user.sub,
      });
      results.push(created);
    }
    return res.status(201).json({ message: '批次建立成功', sessions: results });
  } catch (error) {
    console.error('Bulk create event sessions failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;