// Minimal Express auth server for local development
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcrypt'); // Temporarily disabled due to installation issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDatabase } = require('./db/pool'); // Import database initialization
const { authMiddleware, roleMiddleware } = require('./middleware/auth'); // Import auth middleware




const app = express();

// Allow frontend on http://localhost:3000 to send credentials
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

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

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// Get current user info (protected)
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.sub, username: req.user.username, role: req.user.role });
});

// Example protected admin route
app.get('/api/admin/data', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json({ secret: 'only admins see this' });
});

const port = process.env.PORT || 4000;

// Initialize the database before starting the server
async function startServer() {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Server start failed:', err);
    process.exit(1);
  }
}

startServer();
