// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const { register, observeRequest, startMetricsCollection } = require('./Utils/monitoring');

const authRoutes = require('./Routes/authRoutes');
const expenseRoutes = require('./Routes/expenseRoutes');
const budgetRoutes = require('./Routes/budgetRoutes');
const goalRoutes = require('./Routes/goalRoutes');
const reminderRoutes = require('./Routes/reminderRoutes');
const accountRoutes = require('./Routes/accountRoutes');
const tagRoutes = require('./Routes/tagRoutes');
const { authenticateToken } = require('./Middleware/authMiddleware');

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI must be defined in the environment');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_this_secret') {
  throw new Error('JWT_SECRET must be set to a production secret');
}

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  const start = process.hrtime.bigint();

  console.info(JSON.stringify({
    level: 'info',
    event: 'request.start',
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
  }));

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    observeRequest(req, res, durationMs);
    console.info(JSON.stringify({
      level: 'info',
      event: 'request.end',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      timestamp: new Date().toISOString(),
    }));
  });

  next();
});

mongoose.set('strictQuery', true);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expense';

mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/tags', tagRoutes);

// Health check with DB state for deployment monitoring
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: true,
    pid: process.pid,
    uptime: process.uptime(),
    dbState,
    dbReady: dbState === 1,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const ready = dbState === 1;
  res.status(ready ? 200 : 503).json({
    ok: ready,
    dbState,
    dbReady: ready,
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// update profile (allow setting monthlyIncome)
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const User = require('./models/User');
    const { name, email, monthlyIncome } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (monthlyIncome !== undefined) update.monthlyIncome = Number(monthlyIncome) || 0;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('name email monthlyIncome');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Profile update error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Example protected route - return full user info from DB
const User = require('./models/User');
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email monthlyIncome');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, monthlyIncome: user.monthlyIncome || 0 } });
  } catch (err) {
    console.error('Profile error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
const metricsInterval = startMetricsCollection();

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const shutdown = async (signal) => {
  console.info(JSON.stringify({ level: 'info', event: 'server.shutdown', signal, timestamp: new Date().toISOString() }));
  clearInterval(metricsInterval);
  server.close(async () => {
    try {
      await mongoose.disconnect();
      console.info(JSON.stringify({ level: 'info', event: 'mongodb.disconnected', timestamp: new Date().toISOString() }));
      process.exit(0);
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', event: 'shutdown.error', message: err.message, timestamp: new Date().toISOString() }));
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error(JSON.stringify({ level: 'error', event: 'shutdown.timeout', timestamp: new Date().toISOString() }));
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
