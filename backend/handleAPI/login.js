const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findByUserId } = require('../dao/usersDao');

router.post('/login', async (req, res) => {
  try {
    console.log('收到登入請求:', { username: req.body.username });
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    const user = await findByUserId(username);
    console.log('查找用戶結果:', user ? '找到用戶' : '未找到用戶');
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('登入成功:', { id: user.user_id, role: user.role });
    
    res.json({ 
      id: user.user_id, 
      name: user.name, 
      role: user.role,
      username: user.email || username // 確保回傳 username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;