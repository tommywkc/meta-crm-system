const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findByUserId } = require('../dao/usersDao');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';

router.post('/login', async (req, res) => {
  try {
  console.log('Received login request:', { username: req.body.username });
    const { username, password } = req.body;
    
    if (/\D/.test(username) == true) {
      console.log('Username contains invalid characters');
      return res.status(400).json({ message: '使用者名稱只能包含數字' });
    }

    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: '缺少使用者名稱或密碼' });
    }

    const user = await findByUserId(username);
  console.log('User lookup result:', user ? 'found' : 'not found');
    
    if (!user || user.password !== password) {
      console.log('Invalid username or password');
      return res.status(401).json({ message: '使用者名稱或密碼錯誤' });
    }

  console.log('Login successful:', { id: user.user_id, role: user.role });

  // generate JWT token and set cookie
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

  // return user data without the password
    const { password: _p, ...safe } = user;
    return res.json({ 
      user: { 
        id: safe.user_id || safe.id, 
        name: safe.name, 
        role: safe.role, 
        username: safe.email || username,
        qr_token: user.qr_token
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;