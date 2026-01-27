const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findByUserId } = require('../dao/usersDao');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';

function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSameSite = String(process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
  const explicitSecure = String(process.env.COOKIE_SECURE || '').trim().toLowerCase();
  const cookieSecure = cookieSameSite === 'none' ? true : explicitSecure === 'true' ? true : isProd;

  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: '/',
    maxAge: 30 * 60 * 1000,
  };
}

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
    
    // Debugging: log representations to diagnose mismatches (local/dev only)
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('Stored password repr:', JSON.stringify(user?.password), 'len', String(user?.password || '').length);
        console.log('Provided password repr:', JSON.stringify(password), 'len', String(password || '').length);
        const storedCodes = String(user?.password || '').split('').map(c => c.charCodeAt(0));
        const providedCodes = String(password || '').split('').map(c => c.charCodeAt(0));
        console.log('Stored password char codes (first 20):', storedCodes.slice(0,20));
        console.log('Provided password char codes (first 20):', providedCodes.slice(0,20));
      } catch (e) {
        console.error('Error while logging password debug info:', e.message);
      }
    }

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

    res.cookie('token', token, getAuthCookieOptions());

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