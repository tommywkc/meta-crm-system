const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listByUser, listByPaymentId } = require('../dao/paymentsDao');


router.get('/users/:userId/payments', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者ID' });
    }

    const payments = await listByUser(userId);
    return res.json({ payments });
  } catch (error) {
    console.error('List payments failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});


router.get('/payments', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const payments = await listByPaymentId(limit, offset);
    return res.json({ payments });
  } catch (error) {
    console.error('List payments failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
