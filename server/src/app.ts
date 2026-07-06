import type { Application, Request, Response, NextFunction } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error";
import { notFoundHandler } from "./middleware/notFound";
import { csrfMiddleware, generateCsrfToken } from "./middleware/csrf";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { requestIdMiddleware, attachRequestId } from "./middleware/requestId";
import { metricsRecorderMiddleware, metricsEndpoint } from "./middleware/metrics";
import { featureFlagMiddleware, featureFlagsEndpoint } from "./middleware/featureFlag";
import { analyticsMiddleware } from "./middleware/analytics";
import { logger } from "./utils/logger";
import { ApiResponse } from "./utils/response";
import authRoutes from "./modules/auth.routes";
import userRoutes from "./modules/user.routes";
import productRoutes from "./modules/product.routes";
import cartRoutes from "./modules/cart.routes";
import orderRoutes from "./modules/order.routes";
import favoriteRoutes from "./modules/favorite.routes";
import gameRoutes from "./modules/game.routes";
import prizeRoutes from "./modules/prize.routes";
import adminRoutes from "./modules/admin.routes";
import checkinRoutes from "./modules/checkin.routes";
import inviteRoutes from "./modules/invite.routes";
import recommendRoutes from "./modules/recommend.routes";
import achievementRoutes from "./modules/achievement.routes";
import notificationRoutes from "./modules/notification.routes";

export function createApp(): Application {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set("trust proxy", 1);

  // === Infra middleware (order matters) ===
  app.use(requestIdMiddleware);
  app.use((_req: Request, res: Response, next: NextFunction) => { res.setHeader("X-API-Version", "5.0.0"); next(); });
  app.use(attachRequestId);
  app.use(metricsRecorderMiddleware);
  app.use(featureFlagMiddleware);
  app.use(analyticsMiddleware);

  // Cache control for static API responses
  const staticCachePaths = [
    "/api/products/categories",
    "/api/products/featured",
    "/api/products/hot",
    "/api/products/new",
  ];
  app.use(staticCachePaths, (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    next();
  });

  // === Security ===
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "http://localhost:*", "https:"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Idempotency-Key"],
    }),
  );

  // === Body parsing ===
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  // === Logger ===
  app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.url === "/api/health" || req.url === "/api/health/ready",
    }),
  );

  // === Rate limiting ===
  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "A4290", message: "请求过于频繁，请稍后再试" },
    },
  });
  app.use("/api", globalLimiter);

  // === Health Checks (no auth) ===
  app.get("/api/health", (_req: Request, res: Response) => {
    ApiResponse.ok(res, {
      status: "ok",
      service: "wo-mai-wo-mai-server",
      version: "5.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  app.get("/api/health/ready", async (_req: Request, res: Response) => {
    try {
      const { prisma } = await import("./utils/prisma");
      await prisma.$queryRaw`SELECT 1`;
      ApiResponse.ok(res, { ready: true, db: "connected" });
    } catch (e) {
      logger.error("Readiness check failed:", e);
      res.status(503).json({
        success: false,
        error: { code: "A5031", message: "Service not ready" },
      });
    }
  });


  // === API v1 Router (versioned path for production) ===
  const v1 = express.Router();
  v1.use(idempotencyMiddleware);
  v1.use(csrfMiddleware);
  app.use("/api/v1", v1);
  v1.use("/auth", authRoutes);
  v1.use("/users", userRoutes);
  v1.use("/products", productRoutes);
  v1.use("/cart", cartRoutes);
  v1.use("/orders", orderRoutes);
  v1.use("/favorites", favoriteRoutes);
  v1.use("/games", gameRoutes);
  v1.use("/prizes", prizeRoutes);
  v1.use("/admin", adminRoutes);
  v1.use("/checkin", checkinRoutes);
  v1.use("/invites", inviteRoutes);
  v1.use("/recommend", recommendRoutes);
  v1.use("/achievements", achievementRoutes);
  v1.use("/notifications", notificationRoutes);
  // === API Routes ===
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/games", gameRoutes);
  app.use("/api/prizes", prizeRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/checkin", checkinRoutes);
  app.use("/api/invites", inviteRoutes);
  app.use("/api/recommend", recommendRoutes);
  app.use("/api/achievements", achievementRoutes);
  app.use("/api/notifications", notificationRoutes);

  // === Utility endpoints ===
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    const token = generateCsrfToken(req);
    res.json({ success: true, data: { csrfToken: token } });
  });
  app.get("/api/feature-flags", featureFlagsEndpoint);
  app.get("/api/metrics", metricsEndpoint);

  // === 404 + Error handler ===
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
