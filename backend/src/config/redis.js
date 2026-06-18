const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    logger.warn('No Redis config found — skipping Redis connection');
    return null;
  }

  const config = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      };

  client = createClient(config);

  // Never crash the app on Redis errors — just log them
  client.on('error', err => {
    logger.warn('Redis connection error (non-fatal):', err.code || err.message);
  });

  try {
    await client.connect();
    logger.info('Redis connected');
    return client;
  } catch (err) {
    logger.warn('Redis failed to connect (app continues without queue):', err.message);
    client = null;
    return null;
  }
}

function getRedis() { return client; }

module.exports = { connectRedis, getRedis };
