// Minimal Express auth server for local development
const express = require('express');
// const bcrypt = require('bcrypt'); // Temporarily disabled due to installation issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDatabase } = require('./db/pool'); // Import database initialization




const app = express();

// Allow frontend on http://localhost:3000 to send credentials
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(cookieParser());

// 加入請求日誌中間件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

const loginRouter = require('./handleAPI/login');
console.log('Login router loaded');
app.use('/api', loginRouter); // Use the login router

// In-memory users for demo (plain text passwords for development only)
// Passwords: member -> password, sales -> password, admin -> adminpass

const customersRouter = require('./handleAPI/customersList');
console.log('Customers router loaded');
app.use('/api', customersRouter); // Use the customers router

// JWT 設定
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';



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

// 啟動 server 前初始化資料庫
async function startServer() {
    try {
        await initDatabase();
        app.listen(port, () => {
            console.log(`伺服器運行在 port ${port}`);
        });
    } catch (err) {
        console.error('伺服器啟動失敗:', err);
        process.exit(1);
    }
}

startServer();
