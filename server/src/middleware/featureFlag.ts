import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../cache/redis";
import { logger } from "../utils/logger";

const FLAGS_KEY = "feature:flags";
const CACHE_TTL = 60; // seconds

let localCache: Record<string, { enabled: boolean; rollout: number }> = {};
let lastRefresh = 0;

async function refreshFlags(): Promise<Record<string, { enabled: boolean; rollout: number }>> {
  const now = Date.now();
  if (Object.keys(localCache).length > 0 && now - lastRefresh < CACHE_TTL * 1000) {
    return localCache;
  }

  try {
    const redis = getRedis();
    const cached = await redis.get(FLAGS_KEY);
    if (cached) {
      localCache = JSON.parse(cached);
      lastRefresh = now;
      return localCache;
    }

    const { prisma } = await import("../utils/prisma");
    const flags = await prisma.featureFlag.findMany();
    const flagMap: Record<string, { enabled: boolean; rollout: number }> = {};
    for (const f of flags) {
      flagMap[f.key] = { enabled: f.enabled, rollout: f.rollout };
    }

    await redis.setex(FLAGS_KEY, CACHE_TTL, JSON.stringify(flagMap));
    localCache = flagMap;
    lastRefresh = now;
    return flagMap;
  } catch (e) {
    logger.error("Failed to refresh feature flags:", e);
    return localCache;
  }
}

function isEnabledForRequest(flag: { enabled: boolean; rollout: number }, req: Request): boolean {
  if (!flag.enabled) return false;
  if (flag.rollout >= 100) return true;
  if (flag.rollout <= 0) return false;
  const seed = req.headers["authorization"]?.slice(-8) || req.ip || "default";
  const hash = Array.from(seed).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return Math.abs(hash) % 100 < flag.rollout;
}

export async function featureFlagMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const flags = await refreshFlags();
  const enabled: string[] = [];
  for (const [key, flag] of Object.entries(flags)) {
    if (isEnabledForRequest(flag, req)) enabled.push(key);
  }
  res.locals.featureFlags = enabled;
  next();
}

export async function featureFlagsEndpoint(req: Request, res: Response): Promise<void> {
  const flags = await refreshFlags();
  const perRequest: Record<string, { enabled: boolean; rollout: number }> = {};
  for (const [key, flag] of Object.entries(flags)) {
    perRequest[key] = { enabled: isEnabledForRequest(flag, req), rollout: flag.rollout };
  }
  res.json({ success: true, data: perRequest });
}
