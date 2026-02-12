const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const waitlistDao = require('../dao/waitlistDao');
const { listByUserIds } = require('../dao/usersDao');
const { findBySessionId } = require('../dao/eventSessionsDao');
const { findByEventId } = require('../dao/eventsDao');
const { checkIsConfirmedEnrolled } = require('../dao/eventEnrollmentsDao');
const { findBySessionAndUser } = require('../dao/sessionRegistrationsDao');

const parseWaitlist = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

router.get('/waitlist', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const sessionIdRaw = req.query.session_id;
    const sessionId = sessionIdRaw ? parseInt(sessionIdRaw, 10) : null;

    if (sessionIdRaw && Number.isNaN(sessionId)) {
      return res.status(400).json({ message: '無效的 session_id' });
    }

    const rows = sessionId
      ? [await waitlistDao.findBySessionId(sessionId)].filter(Boolean)
      : await waitlistDao.listAll();

    if (!rows || rows.length === 0) {
      return res.json({ waitlist: [] });
    }

    const results = [];

    for (const row of rows) {
      const list = parseWaitlist(row.waitlist);
      const userIds = list.map((v) => parseInt(v, 10)).filter((v) => !Number.isNaN(v));
      const users = await listByUserIds(userIds);
      const userMap = new Map((users || []).map((u) => [String(u.user_id), u]));

      const session = await findBySessionId(row.session_id);
      const event = session?.event_id ? await findByEventId(session.event_id) : null;

      list.forEach((userId, idx) => {
        const user = userMap.get(String(userId)) || null;
        results.push({
          wait_id: row.wait_id,
          session_id: row.session_id,
          session_name: session?.session_name || null,
          datetime_start: session?.datetime_start || null,
          datetime_end: session?.datetime_end || null,
          event_id: session?.event_id || null,
          event_name: event?.event_name || null,
          rank: idx + 1,
          user_id: user ? user.user_id : userId,
          name: user?.name || null,
          role: user?.role || null,
          mobile: user?.mobile || null,
          email: user?.email || null,
          status: 'WAITLIST',
        });
      });
    }

    return res.json({ waitlist: results });
  } catch (error) {
    console.error('Get waitlist failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/waitlist/apply', authMiddleware, roleMiddleware(['admin', 'sales']), async (req, res) => {
  try {
    const { session_id, user_id } = req.body || {};
    if (!session_id || !user_id) {
      return res.status(400).json({ message: '缺少必要的候補資料（需要 session_id 和 user_id）' });
    }

    const sessionId = parseInt(session_id, 10);
    const userId = parseInt(user_id, 10);
    if (isNaN(sessionId) || isNaN(userId)) {
      return res.status(400).json({ message: '無效的 session_id 或 user_id' });
    }

    const session = await findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ message: '場次不存在' });
    }

    const eventId = session.event_id;
    if (!eventId) {
      return res.status(400).json({ message: '此場次沒有對應活動，無法加入候補' });
    }

    const isEnrolled = await checkIsConfirmedEnrolled(userId, eventId);
    if (!isEnrolled) {
      return res.status(400).json({ message: '使用者尚未報名此場次所屬的活動，無法加入候補' });
    }

    const existingRegistration = await findBySessionAndUser(sessionId, userId);
    if (existingRegistration) {
      return res.status(400).json({ message: '使用者已報名此場次' });
    }

    const existingWaitlist = await waitlistDao.findBySessionId(sessionId);
    const currentList = parseWaitlist(existingWaitlist?.waitlist);
    if (currentList.map((v) => String(v)).includes(String(userId))) {
      return res.status(400).json({ message: '使用者已在候補名單中' });
    }

    const remainingSeats = session.remaining_seats;
    if (remainingSeats != null && Number(remainingSeats) > 0) {
      return res.status(400).json({ message: '此場次仍有名額，請直接報名' });
    }

    const updated = await waitlistDao.appendUserToWaitlist(sessionId, userId);
    return res.status(201).json({ message: '已加入候補名單', waitlist: updated });
  } catch (error) {
    console.error('Apply waitlist failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/waitlist/rank', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { session_id, user_id, new_rank } = req.body || {};
    if (!session_id || !user_id || !new_rank) {
      return res.status(400).json({ message: '缺少必要的參數（需要 session_id, user_id, new_rank）' });
    }

    const sessionId = parseInt(session_id, 10);
    const userId = parseInt(user_id, 10);
    const nextRank = parseInt(new_rank, 10);
    if (Number.isNaN(sessionId) || Number.isNaN(userId) || Number.isNaN(nextRank) || nextRank <= 0) {
      return res.status(400).json({ message: '無效的參數' });
    }

    const row = await waitlistDao.findBySessionId(sessionId);
    if (!row) {
      return res.status(404).json({ message: '候補名單不存在' });
    }

    const list = parseWaitlist(row.waitlist);
    const strList = list.map((v) => String(v));
    const idx = strList.indexOf(String(userId));
    if (idx === -1) {
      return res.status(404).json({ message: '使用者不在候補名單中' });
    }

    const listWithout = list.filter((_, i) => i !== idx);
    const boundedRank = Math.min(Math.max(nextRank, 1), listWithout.length + 1);
    const insertIndex = boundedRank - 1;
    listWithout.splice(insertIndex, 0, list[idx]);

    const updated = await waitlistDao.updateBySessionId(sessionId, JSON.stringify(listWithout));
    return res.status(200).json({ message: '排名已更新', waitlist: updated });
  } catch (error) {
    console.error('Update waitlist rank failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
