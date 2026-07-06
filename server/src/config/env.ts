import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// 闁哄嫭鍎崇槐锟犲礉閻樼儤绁?server/.env闁挎稑鐗嗛崥瀣偓褰掆偓娑氱煠闁哄秴婀卞ú鎷屻亹閺囩喎鐏?server 闁烩晩鍠栫紞宥夊触椤栨艾袟闁?dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).optional().default("sqlite"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_POOL_MAX: z.coerce.number().int().positive().default(20),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(2),
  DB_IDLE_TIMEOUT: z.coerce.number().int().positive().default(10000),
  DB_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(30000),

  // Redis (optional — falls back to in-memory if not set)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().int().positive().default(5_242_880),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('闁?Invalid environment variables:');
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const BCRYPT_ROUNDS = 12;
export type Env = typeof env;
