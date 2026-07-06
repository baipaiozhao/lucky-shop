import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { initRedis, closeRedis } from "./cache/redis";
import { startScheduler } from "./scheduler";

async function bootstrap(): Promise<void> {
  const app = createApp();
  await initRedis();
  startScheduler();

  const httpServer = app.listen(env.PORT, env.HOST, () => {
    httpServer.keepAliveTimeout = 65_000;
    httpServer.headersTimeout = 66_000;
    logger.info("LuckyShop Server running at http://" + env.HOST + ":" + env.PORT);
    logger.info("Health check: http://" + env.HOST + ":" + env.PORT + "/api/health");
    logger.info("Environment: " + env.NODE_ENV);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(signal + " received, shutting down gracefully...");
    httpServer.close(async (err) => {
      if (err) {
        logger.error("Error during server close:", err);
        process.exit(1);
      }
      try {
        const { prisma } = await import("./utils/prisma");
        await Promise.all([prisma.$disconnect(), closeRedis()]);
        logger.info("Prisma and Redis disconnected");
        process.exit(0);
      } catch (e) {
        logger.error("Error during shutdown:", e);
        process.exit(1);
      }
    });
    setTimeout(() => {
      logger.error("Forcing shutdown after 10s timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("uncaughtException", (err: Error & { code?: string }) => {
    if (err.code === "EPIPE") return;
    logger.error("Uncaught exception:", err);
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
  });
  process.stdout.on("error", (err: Error & { code?: string }) => {
    if (err.code === "EPIPE") return;
    logger.error("stdout error:", err);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap:", err);
  process.exit(1);
});
