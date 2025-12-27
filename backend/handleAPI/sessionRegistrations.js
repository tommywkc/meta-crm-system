const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createRegistration, findBySessionAndUser, listUpcomingSessionsByUser, listSessionsByUserAndYear } = require('../dao/sessionRegistrationsDao');

// Create a new session registration (場次報名)
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

    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }

    const sessions = await listUpcomingSessionsByUser(userId, limit);

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get upcoming sessions for current user failed:', error);
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

module.exports = router;
