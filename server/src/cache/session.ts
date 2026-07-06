import { getRedis } from "./redis";

/**
 * Session / Token Cache
 *
 * Use cases:
 * - JWT blacklist (logout invalidation)
 * - Refresh token storage
 * - Password reset token tracking
 */
export class SessionCache {
  private readonly prefix = "session:";

  /**
   * Blacklist a JWT token (for logout).
   * TTL should match the remaining token lifetime.
   */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    await redis.setex(`${this.prefix}blacklist:${jti}`, ttlSeconds, "1");
  }

  /**
   * Check if a token is blacklisted.
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.exists(`${this.prefix}blacklist:${jti}`);
    return result === 1;
  }

  /**
   * Store a refresh token with TTL.
   */
  async storeRefreshToken(userId: string, token: string, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    await redis.setex(`${this.prefix}refresh:${userId}`, ttlSeconds, token);
  }

  /**
   * Validate a refresh token.
   */
  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const redis = getRedis();
    const stored = await redis.get(`${this.prefix}refresh:${userId}`);
    return stored === token;
  }

  /**
   * Store a password reset token.
   */
  async storeResetToken(email: string, token: string, ttlSeconds = 3600): Promise<void> {
    const redis = getRedis();
    await redis.setex(`${this.prefix}reset:${email}`, ttlSeconds, token);
  }

  /**
   * Consume (get and delete) a reset token.
   */
  async consumeResetToken(email: string): Promise<string | null> {
    const redis = getRedis();
    const key = `${this.prefix}reset:${email}`;
    const token = await redis.get(key);
    if (token) await redis.del(key);
    return token;
  }
}

export const sessionCache = new SessionCache();
