import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

// ── Request Context (async-local storage) ──
export interface RequestContext {
  requestId: string;
  userId?: string;
  startTime: number;
}

const als = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return als.getStore();
}

// ── Middleware ──
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Accept incoming x-request-id or generate new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  const ctx: RequestContext = {
    requestId,
    startTime: Date.now(),
  };

  // Expose via response header
  res.setHeader('x-request-id', requestId);

  // Run the rest of the request in async context
  als.run(ctx, () => {
    next();
  });
}

// Augment Express Request with requestId for convenience
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

// Attach requestId to req object (called after requestIdMiddleware)
export function attachRequestId(req: Request, _res: Response, next: NextFunction): void {
  const ctx = getRequestContext();
  if (ctx) {
    req.requestId = ctx.requestId;
  }
  next();
}
