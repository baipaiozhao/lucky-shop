import type { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

// ── Async analytics event queue (fire-and-forget, non-blocking) ──
const eventQueue: Array<{
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}> = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 10_000; // Flush every 10s
const MAX_QUEUE_SIZE = 100;

// Guard: prevent execution after Jest environment teardown
let __jestTeardown = false;
if (typeof afterAll !== "undefined") {
  try { afterAll(() => { __jestTeardown = true; }); } catch(e) { /* not in jest */ }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL_MS).unref();
}

async function flushEvents(): Promise<void> {
  flushTimer = null;
  if (__jestTeardown) { eventQueue.length = 0; return; }
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, eventQueue.length);
  try {
    const { prisma } = await import('../utils/prisma');
    await prisma.analyticsEvent.createMany({
      data: batch.map((e) => ({
        userId: e.userId,
        sessionId: e.sessionId,
        event: e.event,
        id: crypto.randomUUID(), properties: JSON.stringify(e.properties),
        createdAt: e.timestamp,
      })),
    });
    logger.debug(`Analytics flushed: ${batch.length} events`);
  } catch (err) {
    logger.error('Analytics flush failed:', err);
    // Re-queue on failure (up to max)
    if (eventQueue.length < MAX_QUEUE_SIZE * 2) {
      eventQueue.unshift(...batch);
    }
  }
}

function trackEvent(event: string, properties: Record<string, unknown>, userId?: string, sessionId?: string): void {
  eventQueue.push({
    userId,
    sessionId: sessionId || 'anon',
    event,
    properties,
    timestamp: new Date(),
  });

  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    // Flush immediately if queue is full
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushEvents();
  } else {
    scheduleFlush();
  }
}

// ── Middleware: auto-track page views and key events ──
export function analyticsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = (req.headers['x-session-id'] as string) || nanoid();
  const authReq = req as import('./auth').AuthRequest;
  const userId = authReq.user?.id;

  // Track page view
  const path = req.path;
  if (!path.startsWith('/api/health') && !path.startsWith('/metrics')) {
    trackEvent('page_view', {
      method: req.method,
      path,
      referer: req.headers.referer || '',
      userAgent: (req.headers['user-agent'] || '').slice(0, 200),
    }, userId, sessionId);
  }

  // Track key business events based on path
  res.on('finish', () => {
    if (res.statusCode >= 400) return; // Skip error responses

    if (path === '/api/orders' && req.method === 'POST') {
      trackEvent('order_created', { path }, userId, sessionId);
    } else if (path.startsWith('/api/games/') && path.endsWith('/complete') && req.method === 'POST') {
      trackEvent('game_completed', { gameType: path.split('/')[3] }, userId, sessionId);
    } else if (path.startsWith('/api/auth/login') && req.method === 'POST') {
      trackEvent('user_login', {}, userId, sessionId);
    } else if (path.startsWith('/api/auth/register') && req.method === 'POST') {
      trackEvent('user_register', {}, userId, sessionId);
    }
  });

  next();
}

// ── Programmatic tracking (call from any route) ──
export async function trackBusinessEvent(
  event: string,
  properties: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  trackEvent(event, properties, userId);
}

// Flush remaining events on process exit
process.on('beforeExit', () => flushEvents());
