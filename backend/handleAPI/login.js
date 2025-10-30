const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findByUserId } = require('../dao/usersDao');

// JWT 設定
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';

router.post('/login', async (req, res) => {
  try {
    console.log('收到登入請求:', { username: req.body.username });
    const { username, password } = req.body;
    
    if (/\D/.test(username) == true) {
      console.log('含有其他字元');
      return res.status(400).json({ message: '使用者名稱只能包含數字' });
    }

    if (!username || !password) {
      console.log('缺少使用者名稱或密碼');
      return res.status(400).json({ message: '缺少使用者名稱或密碼' });
    }

    const user = await findByUserId(username);
    console.log('查找用戶結果:', user ? '找到用戶' : '未找到用戶');
    
    if (!user || user.password !== password) {
      console.log('使用者名稱或密碼錯誤');
      return res.status(401).json({ message: '使用者名稱或密碼錯誤' });
    }

    console.log('登入成功:', { id: user.user_id, role: user.role });

    // 生成 JWT token 並設置 cookie
    const payload = {
      sub: user.user_id || user.id,
      username: user.email || username,
      role: user.role || 'member'
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000
    });

    // 回傳不含密碼的使用者資料
    const { password: _p, ...safe } = user;
    return res.json({ 
      user: { 
        id: safe.user_id || safe.id, 
        name: safe.name, 
        role: safe.role, 
        username: safe.email || username 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;