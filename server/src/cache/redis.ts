import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Redis Client Adapter
 *
 * Production: uses ioredis (real Redis)
 * Development: uses in-memory Map fallback (no Redis dependency needed)
 *
 * Auto-detects: if REDIS_URL is set, use Redis; otherwise fallback to memory.
 */
type CacheEntry = { value: string; expiresAt: number | null };

class MemoryRedis {
  private store = new Map<string, CacheEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000).unref();
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<"OK" | null> {
    const expiresAt = (mode === "EX" && ttl) ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async setex(key: string, ttl: number, value: string): Promise<"OK"> {
    this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async expire(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ttl * 1000;
    return 1;
  }

  async incr(key: string): Promise<number> {
    const val = parseInt((await this.get(key)) || "0") + 1;
    await this.set(key, String(val));
    return val;
  }

  async decr(key: string): Promise<number> {
    const val = Math.max(0, parseInt((await this.get(key)) || "0") - 1);
    await this.set(key, String(val));
    return val;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    const result: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) result.push(key);
    }
    return result;
  }

  async flushall(): Promise<"OK"> {
    this.store.clear();
    return "OK";
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  disconnect() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

// IORedis-like interface
export interface RedisClient {
  set(key: string, value: string, mode?: string, ttl?: number): Promise<"OK" | null>;
  setex(key: string, ttl: number, value: string): Promise<"OK">;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<"OK">;
  ping(): Promise<"PONG">;
  disconnect(): void;
}

let client: RedisClient;

async function createRealRedis(): Promise<RedisClient> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Redis = require('ioredis');
  const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });
  redis.on('error', (err: Error) => logger.error('Redis error', { message: err.message }));
  redis.on('connect', () => logger.info('Redis connected'));
  await redis.connect();
  await redis.ping();
  return redis as unknown as RedisClient;
}

function createMemoryFallback(): RedisClient {
  logger.info("Using in-memory Redis fallback (set REDIS_URL for production)");
  return new MemoryRedis();
}

export async function initRedis(): Promise<void> {
  if (client) return;
  if (env.REDIS_URL) {
    try {
      client = await createRealRedis();
      logger.info("Redis initialized (real)");
      return;
    } catch (err) {
      logger.error("Failed to connect to Redis, falling back to memory", err);
    }
  }
  client = createMemoryFallback();
}

export function getRedis(): RedisClient {
  if (!client) {
    // Lazy init — creates memory fallback
    client = createMemoryFallback();
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    client.disconnect();
    logger.info("Redis disconnected");
  }
}