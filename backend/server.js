// Minimal Express auth server for local development
const express = require('express');
// const bcrypt = require('bcrypt'); // Temporarily disabled due to installation issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Allow frontend on http://localhost:3000 to send credentials
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// In-memory users for demo (plain text passwords for development only)
// Passwords: member -> password, sales -> password, admin -> adminpass
const users = [
  { id: 1, username: 'member', password: 'password', role: 'member' },
  { id: 2, username: 'sales', password: 'password', role: 'sales' },
  { id: 3, username: 'admin', password: 'adminpass', role: 'admin' }
];

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';

function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing username or password' });

  const user = findUserByUsername(username);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // Simple password comparison for development (replace with bcrypt in production)
  const ok = password === user.password;
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const payload = { sub: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // local dev; set true in production with HTTPS
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000
  });

  res.json({ id: user.id, username: user.username, role: user.role });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

function authMiddleware(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.sub, username: req.user.username, role: req.user.role });
});

// Example protected admin route
app.get('/api/admin/data', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  res.json({ secret: 'only admins see this' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Auth API running on port', port));
