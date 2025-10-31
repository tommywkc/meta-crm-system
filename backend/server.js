// Minimal Express auth server for local development
const express = require('express');
// const bcrypt = require('bcrypt'); // Temporarily disabled due to installation issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDatabase } = require('./db/pool'); // Import database initialization




const app = express();

// Allow frontend to send credentials
const allowedOrigins = [
  'http://localhost:3000',
  'https://meta-crm-frontend-v1.azurewebsites.net',
  'http://meta-crm-frontend-v1.azurewebsites.net'
];

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
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

// 健康檢查端點
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Meta CRM Backend API is running',
    timestamp: new Date().toISOString()
  });
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
        // 如果沒有設定 DATABASE_URL，則跳過資料庫初始化
        if (process.env.DATABASE_URL) {
            await initDatabase();
            console.log('資料庫初始化成功');
        } else {
            console.log('跳過資料庫初始化 (未設定 DATABASE_URL)');
        }
        app.listen(port, () => {
            console.log(`伺服器運行在 port ${port}`);
        });
    } catch (err) {
        console.error('伺服器啟動失敗:', err);
        // 在測試環境下，即使資料庫失敗也繼續啟動
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
            process.exit(1);
        } else {
            console.log('忽略資料庫錯誤，繼續啟動伺服器...');
            app.listen(port, () => {
                console.log(`伺服器運行在 port ${port} (無資料庫)`);
            });
        }
    }
}

startServer();
