require('dotenv').config();
const Bull = require('bull');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Content = require('../models/Content.model');
const { User, Workspace } = require('../models/User.model');
const { getPublisher } = require('../services/publisher.service');

const publishQueue = new Bull('publish-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Process publish jobs
publishQueue.process('publish-content', 5, async (job) => {
  const { contentId } = job.data;
  logger.info(`Processing publish job for content: ${contentId}`);

  const content = await Content.findById(contentId).lean();
  if (!content) throw new Error(`Content ${contentId} not found`);

  const workspace = await Workspace.findById(content.workspaceId).select('+platforms.accessToken +platforms.refreshToken');
  if (!workspace) throw new Error(`Workspace not found`);

  // Update status to publishing
  await Content.findByIdAndUpdate(contentId, { status: 'publishing' });

  const results = [];
  const errors = [];

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
      logger.info(`Published to ${platform}: ${result.platformPostId}`);
    } catch (err) {
      errors.push({ platform, error: err.message });
      results.push({ platform, status: 'failed', error: err.message });
      logger.error(`Failed to publish to ${platform}:`, err.message);
    }
  }

  const allFailed = results.every(r => r.status === 'failed');
  const allPublished = results.every(r => r.status === 'published' || r.status === 'skipped');

  await Content.findByIdAndUpdate(contentId, {
    status: allFailed ? 'failed' : allPublished ? 'published' : 'published',
    publishedAt: new Date(),
    publishResults: results,
  });

  return { contentId, results };
});

// Retry failed jobs
publishQueue.on('failed', async (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
  if (job.attemptsMade >= 3) {
    await Content.findByIdAndUpdate(job.data.contentId, { status: 'failed' });
  }
});

publishQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

// Schedule checker — runs every minute
const cron = require('node-cron');
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const due = await Content.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    }).select('_id').lean();

    for (const c of due) {
      const exists = await publishQueue.getJob(c._id.toString());
      if (!exists) {
        await publishQueue.add('publish-content', { contentId: c._id }, {
          jobId: c._id.toString(),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
        logger.info(`Queued scheduled content: ${c._id}`);
      }
    }
  } catch (err) {
    logger.error('Scheduler cron error:', err);
  }
});

// Connect and start
async function startWorker() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omnipost');
  logger.info('Scheduler worker started');
}

startWorker();

module.exports = { publishQueue };
