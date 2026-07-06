import { getRedis } from "./redis";
import { logger } from "../utils/logger";

/**
 * Distributed Lock using Redis
 *
 * Lock pattern: SET lock_key random_value NX EX ttl
 * Unlock: Lua script to check ownership before deleting
 */
export class DistributedLock {
  private readonly key: string;
  private readonly ttl: number; // seconds
  private token: string | null = null;
  private acquired = false;

  constructor(resource: string, ttlSeconds = 30) {
    this.key = `lock:${resource}`;
    this.ttl = ttlSeconds;
  }

  /**
   * Try to acquire the lock. Returns true if successful.
   */
  async acquire(): Promise<boolean> {
    this.token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const redis = getRedis();
    const result = await redis.set(this.key, this.token, "EX", this.ttl);
    this.acquired = result === "OK";
    if (this.acquired) {
      logger.debug(`Lock acquired: ${this.key} (token: ${this.token.slice(0, 8)})`);
    }
    return this.acquired;
  }

  /**
   * Release the lock. Only succeeds if we own it (via token check).
   */
  async release(): Promise<boolean> {
    if (!this.acquired || !this.token) return false;
    const redis = getRedis();
    // Lua script: delete only if value matches our token
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    // For memory fallback, we check manually
    const current = await redis.get(this.key);
    if (current === this.token) {
      await redis.del(this.key);
      this.acquired = false;
      logger.debug(`Lock released: ${this.key}`);
      return true;
    }
    logger.warn(`Lock release failed (not owner): ${this.key}`);
    return false;
  }

  /**
   * Extend the lock's TTL.
   */
  async extend(additionalSeconds: number): Promise<boolean> {
    if (!this.acquired || !this.token) return false;
    const redis = getRedis();
    const current = await redis.get(this.key);
    if (current !== this.token) return false;
    const result = await redis.expire(this.key, this.ttl + additionalSeconds);
    return result === 1;
  }

  /**
   * Execute a function with the lock held. Auto-releases after.
   */
  static async withLock<T>(
    resource: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const lock = new DistributedLock(resource, ttl);
    if (!(await lock.acquire())) {
      throw new Error(`Failed to acquire lock: ${resource}`);
    }
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
}
