import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../cache/redis";

/**
 * CSRF Token Middleware — Redis-backed with memory fallback.
 */
const CSRF_PREFIX = "csrf:";
const CSRF_TTL = 3600; // 1 hour

export function generateCsrfToken(req: Request): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const redis = getRedis();
  // Fire-and-forget: store token in Redis
  redis.setex(`${CSRF_PREFIX}${token}`, CSRF_TTL, req.ip || "unknown");
  return token;
}

export async function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const token = req.headers["x-csrf-token"] as string;
  if (!token) {
    res.status(403).json({
      success: false,
      error: { code: "A4003", message: "CSRF token missing" },
    });
    return;
  }

  const redis = getRedis();
  const exists = await redis.exists(`${CSRF_PREFIX}${token}`);
  if (!exists) {
    res.status(403).json({
      success: false,
      error: { code: "A4003", message: "CSRF token invalid, please refresh" },
    });
    return;
  }

  // One-time use: delete after validation
  await redis.del(`${CSRF_PREFIX}${token}`);
  next();
}
