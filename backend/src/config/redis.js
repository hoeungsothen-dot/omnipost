const { createClient } = require('redis');
const logger = require('../utils/logger');

let client;

async function connectRedis() {
  client = createClient({
    socket: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') },
    password: process.env.REDIS_PASSWORD,
  });
  client.on('error', err => logger.error('Redis error:', err));
  await client.connect();
  return client;
}

function getRedis() { return client; }

module.exports = { connectRedis, getRedis };
