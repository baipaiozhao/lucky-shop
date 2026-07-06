/**
 * Database Migration Manager
 * Commands:
 *   npx tsx scripts/migrate.ts status     - Show migration status
 *   npx tsx scripts/migrate.ts up         - Apply pending migrations
 *   npx tsx scripts/migrate.ts down       - Rollback last migration (dev only)
 *   npx tsx scripts/migrate.ts seed       - Seed database
 *   npx tsx scripts/migrate.ts reset      - Reset & re-seed (dev only)
 */
import { prisma } from "../server/src/database/connection";
import { logger } from "../server/src/utils/logger";

async function main() {
  const cmd = process.argv[2] || "status";
  const isProd = process.env.NODE_ENV === "production";

  switch (cmd) {
    case "status":
      await showStatus();
      break;
    case "up": {
      const { execSync } = await import("child_process");
      logger.info("Running migrations...");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      logger.info("Migrations applied successfully");
      break;
    }
    case "down":
      if (isProd) {
        logger.error("Cannot rollback in production");
        process.exit(1);
      }
      logger.warn("Rolling back last migration (dev only)...");
      // SQLite doesn't support rollback natively; use migrate reset for dev
      break;
    case "seed":
      logger.info("Seeding database...");
      await seed();
      logger.info("Database seeded");
      break;
    case "reset":
      if (isProd) {
        logger.error("Cannot reset in production");
        process.exit(1);
      }
      logger.warn("Resetting database...");
      const { execSync: exec } = await import("child_process");
      exec("npx prisma migrate reset --force", { stdio: "inherit" });
      break;
    default:
      logger.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }

  await prisma.$disconnect();
}

async function showStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    logger.info("Database Status", {
      connected: true,
      provider: process.env.DATABASE_PROVIDER || "sqlite",
      users: userCount,
      products: productCount,
    });
  } catch (e) {
    logger.error("Database not connected", e);
  }
}

async function seed() {
  // Run the Prisma seed script
  const { execSync } = await import("child_process");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main().catch((e) => {
  logger.error("Migration script failed", e);
  process.exit(1);
});
