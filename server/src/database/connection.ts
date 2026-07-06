import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Database Connection Manager
 * Supports: SQLite (dev/test) | PostgreSQL (production)
 * Features: connection pooling, retry, health check, graceful shutdown
 */

const DEFAULT_POOL_SIZE = env.DATABASE_PROVIDER === "sqlite" ? 1 : 20;
const POOL_TIMEOUT = env.DATABASE_PROVIDER === "sqlite" ? 5000 : 30000;

interface DbConfig {
  provider: string;
  url: string;
  poolMin: number;
  poolMax: number;
}

function getDbConfig(): DbConfig {
  return {
    provider: env.DATABASE_PROVIDER || "sqlite",
    url: env.DATABASE_URL,
    poolMin: env.DATABASE_PROVIDER === "sqlite" ? 1 : 2,
    poolMax: env.DATABASE_PROVIDER === "sqlite" ? 1 : Number(env.DB_POOL_MAX || DEFAULT_POOL_SIZE),
  };
}

/**
 * Create PrismaClient with production-grade configuration.
 */
function createPrismaClient(): PrismaClient {
  const config = getDbConfig();
  const isProd = env.NODE_ENV === "production";
  const isSQLite = config.provider === "sqlite";

  const logLevels: Array<{ level: "query" | "info" | "warn" | "error"; emit: "event" }> = [];
  if (!isProd) {
    logLevels.push({ level: "warn", emit: "event" });
    logLevels.push({ level: "error", emit: "event" });
  } else {
    logLevels.push({ level: "error", emit: "event" });
  }

  const client = new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: config.url,
      },
    },
    // PostgreSQL connection pool settings (ignored by SQLite)
    ...(isSQLite ? {} : {
      datasourceUrl: config.url,
    }),
  });

  // Retry logic for PostgreSQL connections
  if (!isSQLite) {
    const originalConnect = client.$connect.bind(client);
    client.$connect = async () => {
      let retries = 5;
      while (retries > 0) {
        try {
          await originalConnect();
          logger.info(`Database connected (${config.provider})`);
          return;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          logger.warn(`Database connection failed, retrying... (${retries} left)`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };
  }

  // Event listeners
  (client as any).$on("error", (e: any) => {
    logger.error("Prisma error", { message: e.message, target: e.target });
  });

  if (!isProd) {
    (client as any).$on("query", (e: any) => {
      logger.debug("Prisma query", { query: e.query, duration: e.duration + "ms" });
    });
  }

  (client as any).$on("warn", (e: any) => {
    logger.warn("Prisma warning", { message: e.message });
  });

  return client;
}

// Singleton pattern (reuse across hot-reloads in dev)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connection established");
  } catch (error) {
    logger.error("Failed to connect to database", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}



// ???????? JSON Field Serializer ????????
// Prisma schema stores images/tags as JSON strings (SQLite limitation).
// This utility parses them back to arrays before sending to the API.
export function serializeProduct<T extends Record<string, unknown> | null>(product: T): T {
  if (!product) return product;
  const p = product as Record<string, unknown>;
  if (typeof p.images === "string") {
    try { p.images = JSON.parse(p.images as string); } catch { p.images = []; }
  }
  if (typeof p.tags === "string") {
    try { p.tags = JSON.parse(p.tags as string); } catch { p.tags = []; }
  }
  return product;
}

export function serializeProducts<T extends Record<string, unknown> | null>(products: T[]): T[] {
  return products.map(serializeProduct);
}

export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Store reference for dev hot-reload
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
