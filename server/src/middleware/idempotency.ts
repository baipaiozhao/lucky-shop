import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { getRedis } from "../cache/redis";

/**
 * Idempotency Middleware — Redis-backed with memory fallback.
 * Prevents duplicate state-changing requests.
 */
const IDEMPOTENCY_PREFIX = "idem:";
const TTL_SECONDS = 30 * 60; // 30 minutes

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const key = req.headers["idempotency-key"] as string | undefined;
  if (!key) return next();

  if (typeof key !== "string" || key.length === 0 || key.length > 128) {
    res.status(400).json({
      success: false,
      error: { code: "A4011", message: "Idempotency-Key invalid" },
    });
    return;
  }

  const authReq = req as AuthRequest;
  const userId = authReq.user?.id || "anon";
  const cacheKey = `${IDEMPOTENCY_PREFIX}${userId}:${req.method}:${req.originalUrl}:${key}`;

  const redis = getRedis();
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.status(200).json(JSON.parse(cached));
    return;
  }

  // Intercept res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    redis.setex(cacheKey, TTL_SECONDS, JSON.stringify(body));
    return originalJson(body);
  } as typeof res.json;

  next();
}
