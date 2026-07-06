import { getRedis } from "./redis";

/**
 * Redis-backed rate limiter store.
 * Compatible with express-rate-limit's Store interface.
 */
export class RedisRateLimitStore {
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redis = getRedis();
    const current = await redis.get(key);
    const hits = current ? parseInt(current) + 1 : 1;

    if (hits === 1) {
      await redis.setex(key, Math.ceil(this.windowMs / 1000), String(hits));
    } else {
      await redis.set(key, String(hits));
    }

    return {
      totalHits: hits,
      resetTime: new Date(Date.now() + this.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const redis = getRedis();
    await redis.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(key);
  }
}
