import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().default('infrapilot_super_secret_jwt_key_2026_dev'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DEMO_MODE: z.string().transform((v) => v === 'true').default('true'),
  TERRAFORM_DIR: z.string().default('../infrastructure/terraform/demo'),
  TERRAFORM_BINARY: z.string().default('terraform'),
  EXECUTION_TIMEOUT_MS: z.string().transform(Number).default('60000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
