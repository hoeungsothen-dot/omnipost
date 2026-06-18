require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/omnipost';

let publishQueue = null;

// Only set up Bull queue if Redis is available
async function setupQueue() {
  try {
    const Bull = require('bull');
    const Content = require('../models/Content.model');
    const { Workspace } = require('../models/User.model');
    const { getPublisher } = require('../services/publisher.service');
    const notifService = require('../services/notification.service');

    publishQueue = new Bull('publish-queue', {
      redis: process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    });

    publishQueue.process('publish-content', 5, async (job) => {
      const { contentId } = job.data;
      logger.info(`Processing publish job for content: ${contentId}`);

      const content = await Content.findById(contentId).lean();
      if (!content) throw new Error(`Content ${contentId} not found`);

      const workspace = await Workspace.findById(content.workspaceId)
        .select('+platforms.accessToken +platforms.refreshToken');
      if (!workspace) throw new Error('Workspace not found');

      await Content.findByIdAndUpdate(contentId, { status: 'publishing' });

      const results = [];
      for (const platform of content.platforms) {
        const connection = workspace.platforms.find(p => p.platform === platform && p.connected);
        if (!connection) {
          results.push({ platform, status: 'skipped', error: 'Platform not connected' });
          continue;
        }
        try {
          const publisher = getPublisher(connection);
          const result = await publisher.publish(content);
          results.push(result);
        } catch (err) {
          results.push({ platform, status: 'failed', error: err.message });
        }
      }

      const allFailed = results.every(r => r.status === 'failed');
      await Content.findByIdAndUpdate(contentId, {
        status: allFailed ? 'failed' : 'published',
        publishedAt: new Date(),
        publishResults: results,
      });

      return { contentId, results };
    });

    publishQueue.on('failed', async (job, err) => {
      logger.error(`Job ${job.id} failed:`, err.message);
    });

    logger.info('Bull queue ready');
    return publishQueue;
  } catch (err) {
    logger.warn('Bull/Redis not available, queue disabled:', err.message);
    return null;
  }
}

// Cron scheduler — runs every minute, checks for due posts
async function startCron() {
  const cron = require('node-cron');
  const Content = require('../models/Content.model');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const due = await Content.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      }).select('_id').lean();

      for (const c of due) {
        if (publishQueue) {
          const exists = await publishQueue.getJob(c._id.toString());
          if (!exists) {
            await publishQueue.add('publish-content', { contentId: c._id }, {
              jobId: c._id.toString(),
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            });
          }
        } else {
          // Direct publish without queue
          const { getPublisher } = require('../services/publisher.service');
          const { Workspace } = require('../models/User.model');
          const content = await Content.findById(c._id).lean();
          if (!content) continue;
          const workspace = await Workspace.findById(content.workspaceId)
            .select('+platforms.accessToken +platforms.refreshToken');
          if (!workspace) continue;

          await Content.findByIdAndUpdate(c._id, { status: 'publishing' });
          const results = [];
          for (const platform of content.platforms) {
            const conn = workspace.platforms.find(p => p.platform === platform && p.connected);
            if (!conn) { results.push({ platform, status: 'skipped' }); continue; }
            try {
              const publisher = getPublisher(conn);
              const result = await publisher.publish(content);
              results.push(result);
            } catch (err) {
              results.push({ platform, status: 'failed', error: err.message });
            }
          }
          await Content.findByIdAndUpdate(c._id, {
            status: results.every(r => r.status === 'failed') ? 'failed' : 'published',
            publishedAt: new Date(),
            publishResults: results,
          });
        }
      }
    } catch (err) {
      logger.error('Scheduler cron error:', err);
    }
  });

  logger.info('Cron scheduler started');
}

async function startWorker() {
  await mongoose.connect(mongoUri);
  logger.info('Scheduler worker connected to MongoDB');
  await setupQueue();
  await startCron();
}

startWorker().catch(err => {
  logger.error('Worker startup error:', err);
  process.exit(1);
});

module.exports = { publishQueue };
