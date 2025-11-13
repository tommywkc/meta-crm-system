const express = require('express');
const router = express.Router();
const { findByUserId } = require('../dao/usersDao');
const { authMiddleware } = require('../middleware/auth');

// GET /api/user/profile - 取得當前用戶的完整資料（包含 qr_token）
router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    console.log('取得用戶資料請求:', { userId: req.user.sub });
    
    const user = await findByUserId(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 移除敏感資料（密碼）
    const { password, ...safeUser } = user;
    
    console.log('用戶資料取得成功:', { userId: user.user_id, hasQrToken: !!user.qr_token });
    
    res.json({ user: safeUser });
  } catch (error) {
    console.error('取得用戶資料錯誤:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
