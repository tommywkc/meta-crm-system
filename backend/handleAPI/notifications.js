const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listByUserId } = require('../dao/notificationsDao');

router.get('/notifications/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await listByUserId(userId, limit, offset);
    return res.json({ notifications });
  } catch (error) {
    console.error('Get user notifications failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
