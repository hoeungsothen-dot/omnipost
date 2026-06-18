const { createClient } = require('redis');
const logger = require('../utils/logger');

let client;

async function connectRedis() {
  // Railway provides REDIS_URL as a full connection string
  // Standard setup uses REDIS_HOST/REDIS_PORT/REDIS_PASSWORD
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
  client.on('error', err => logger.error('Redis error:', err));
  await client.connect();
  return client;
}

function getRedis() { return client; }

module.exports = { connectRedis, getRedis };
