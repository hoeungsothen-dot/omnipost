require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const platformRoutes = require('./routes/platform.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const schedulerRoutes = require('./routes/scheduler.routes');
const aiRoutes = require('./routes/ai.routes');
const uploadRoutes = require('./routes/upload.routes');
const oauthRoutes = require('./routes/oauth.routes');
const webhookRoutes = require('./routes/webhooks/webhook.routes');
const notificationRoutes = require('./routes/notification.routes');
const mediaRoutes = require('./routes/media.routes');
const teamRoutes = require('./routes/team.routes');

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://omnipost.hoeungsothen.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, _res, next) => { req.io = io; next(); });

// Health check FIRST — responds immediately even before DB connects
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? 'connected' : 'connecting' });
});

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/team', teamRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join:workspace', (workspaceId) => socket.join(`workspace:${workspaceId}`));
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

async function start() {
  const PORT = process.env.PORT || 4000;

  // Start listening IMMEDIATELY so healthcheck passes
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`OmniPost API running on port ${PORT}`);
  });

  // Then connect to databases
  try {
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/omnipost';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
  }

  try {
    await connectRedis();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis not available:', err.message);
  }
}

start();
module.exports = { app, io };
