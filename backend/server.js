// Minimal Express auth server for local development
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcrypt'); // Temporarily disabled due to installation issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDatabase } = require('./db/pool'); // Import database initialization
const { authMiddleware, roleMiddleware } = require('./middleware/auth'); // Import auth middleware
const { findByUserId } = require('./dao/usersDao');




const app = express();

const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  // Needed on Azure App Service (TLS terminated at proxy)
  app.set('trust proxy', 1);
}

function parseAllowedOrigins() {
  const raw = String(process.env.CORS_ORIGINS || '').trim();
  const list = raw
    ? raw.split(',').map(s => s.trim()).filter(Boolean)
    : ['http://localhost:3000'];
  return new Set(list);
}

const allowedOrigins = parseAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    // allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// request logging middleware
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

const homeworkRouter = require('./handleAPI/homework');
console.log('Homework router loaded');
app.use('/api', homeworkRouter); // Use the homework router

const eventRouter = require('./handleAPI/eventList');
console.log('Event router loaded');
app.use('/api', eventRouter); // Use the event router

const userProfileRouter = require('./handleAPI/userProfile');
console.log('User profile router loaded');
app.use('/api', userProfileRouter); // Use the user profile router
 
const eventSessionsRouter = require('./handleAPI/session');
console.log('Event sessions router loaded');
app.use('/api', eventSessionsRouter); // Use the event sessions router

const holidaysRouter = require('./handleAPI/holidays');
console.log('Holidays router loaded');
app.use('/api', holidaysRouter); // Use the holidays router

const enrollmentRouter = require('./handleAPI/enrollment');
console.log('Enrollment router loaded');
app.use('/api', enrollmentRouter); // Use the enrollment router

const paymentsRouter = require('./handleAPI/payments');
console.log('Payments router loaded');
app.use('/api', paymentsRouter); // Use the payments router

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const cookieSameSite = String(process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
  const cookieSecure = cookieSameSite === 'none' ? true : String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true' ? true : isProd;
  res.clearCookie('token', {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: '/',
  });
  res.json({ ok: true });
});

// Get current user info (protected)
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await findByUserId(userId);
    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }
    const profile = {
      id: user.user_id || user.id,
      name: user.name,
      role: user.role,
      username: user.email || req.user.username,
      qr_token: user.qr_token || null
    };
    return res.json(profile);
  } catch (e) {
    console.error('Error in /api/me:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Example protected admin route
app.get('/api/admin/data', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json({ secret: 'only admins see this' });
});

const port = process.env.PORT || 4000;

// Initialize the database before starting the server
async function startServer() {
  try {
    const dbInitFlag = String(process.env.DB_INIT || '').trim().toLowerCase();
    const dbUser = String(process.env.DB_USER || '').trim().toLowerCase();
    const shouldInitDb = (dbInitFlag === '1' || dbInitFlag === 'true' || dbInitFlag === 'yes') || dbUser === 'postgres';

    if (shouldInitDb) {
      await initDatabase();
    } else {
      console.log('DB init skipped (set DB_INIT=true or DB_USER=postgres to run schema.sql).');
    }
    // Start holidays scheduler after DB is ready
    try {
      const { startHolidaySchedules } = require('./services/holidayScheduler');
      startHolidaySchedules();
    } catch (e) {
      console.error('Failed to start Holidays Scheduler:', e);
    }
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Server start failed:', err);
    process.exit(1);
  }
}

startServer();
