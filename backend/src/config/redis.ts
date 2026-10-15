import Redis from 'ioredis';
import { env } from './env.js';

export const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redisClient = new Redis(redisConnectionOptions);

redisClient.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Connected to Redis successfully');
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});
