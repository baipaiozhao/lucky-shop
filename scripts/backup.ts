#!/usr/bin/env node
/**
 * Database Backup & Restore
 *
 * SQLite: copies the .db file
 * PostgreSQL: uses pg_dump / pg_restore
 *
 * Usage:
 *   npx tsx scripts/backup.ts              # Create backup
 *   npx tsx scripts/backup.ts --restore <file>  # Restore from backup
 *   npx tsx scripts/backup.ts --list       # List backups
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "fs";
import { join } from "path";

const BACKUP_DIR = join(process.cwd(), "backups");
const DB_PROVIDER = process.env.DATABASE_PROVIDER || "sqlite";
const DB_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function backupSQLite() {
  // Extract file path from "file:./prisma/dev.db"
  const dbPath = DB_URL.replace("file:", "").replace(/^\.\//, join(process.cwd(), "/"));
  if (!existsSync(dbPath)) {
    console.error("Database file not found:", dbPath);
    process.exit(1);
  }

  ensureBackupDir();
  const backupPath = join(BACKUP_DIR, "backup-" + timestamp() + ".db");
  copyFileSync(dbPath, backupPath);
  console.log("Backup created:", backupPath);
  console.log("Size:", (statSync(backupPath).size / 1024 / 1024).toFixed(2), "MB");
}

async function backupPostgreSQL() {
  const dbName = DB_URL.split("/").pop()?.split("?")[0] || "lucky_shop";
  ensureBackupDir();
  const backupPath = join(BACKUP_DIR, "backup-" + timestamp() + ".sql.gz");

  console.log("Dumping PostgreSQL database...");
  execSync(
    `pg_dump ${dbName} | gzip > "${backupPath}"`,
    { stdio: "inherit" },
  );
  console.log("Backup created:", backupPath);
}

async function restoreSQLite(backupFile: string) {
  const dbPath = DB_URL.replace("file:", "").replace(/^\.\//, join(process.cwd(), "/"));
  if (!existsSync(backupFile)) {
    console.error("Backup file not found:", backupFile);
    process.exit(1);
  }
  copyFileSync(backupFile, dbPath);
  console.log("Database restored from:", backupFile);
}

async function listBackups() {
  if (!existsSync(BACKUP_DIR)) {
    console.log("No backups found (directory missing)");
    return;
  }
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup-"))
    .sort()
    .reverse();
  if (files.length === 0) {
    console.log("No backups found");
    return;
  }
  console.log("Backups:");
  for (const f of files) {
    const s = statSync(join(BACKUP_DIR, f));
    console.log(" ", f, "-", (s.size / 1024 / 1024).toFixed(2), "MB", "-", s.mtime.toISOString());
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    await listBackups();
    return;
  }

  const restoreIdx = args.indexOf("--restore");
  if (restoreIdx >= 0 && args[restoreIdx + 1]) {
    const backupFile = args[restoreIdx + 1];
    if (DB_PROVIDER === "sqlite") {
      await restoreSQLite(backupFile);
    } else {
      console.error("PostgreSQL restore not yet automated. Use: gunzip < backup.sql.gz | psql <db>");
    }
    return;
  }

  // Default: create backup
  if (DB_PROVIDER === "sqlite") {
    await backupSQLite();
  } else {
    await backupPostgreSQL();
  }
}

main().catch(console.error);
