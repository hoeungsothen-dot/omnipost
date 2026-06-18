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

// Routes
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

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Attach io to requests
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
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

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorHandler);

// Socket.IO - real-time publish updates
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join:workspace', (workspaceId) => socket.join(`workspace:${workspaceId}`));
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

// Connect databases and start server
async function start() {
  try {
    // Railway uses MONGODB_URL, standard uses MONGODB_URI
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/omnipost';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');

    // Redis is optional — if not configured, scheduled publishing still works via cron
    try {
      await connectRedis();
      logger.info('Redis connected');
    } catch (redisErr) {
      logger.warn('Redis not available — queue features disabled:', redisErr.message);
    }

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, '0.0.0.0', () => logger.info(`OmniPost API running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
}

start();
module.exports = { app, io };
