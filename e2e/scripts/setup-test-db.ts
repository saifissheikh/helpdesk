/**
 * Prepares the e2e test database.
 *
 * Runs *before* Playwright starts the backend webServer — the backend's /health
 * probes the DB, so the schema has to exist before `playwright test` launches.
 *
 * Uses `migrate deploy` + manual schema wipe instead of `migrate reset`, because
 * Prisma 7 gates `migrate reset` behind an AI-consent check while `migrate
 * deploy` is additive-only and runs without interaction.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.resolve(__dirname, "..");
const backendDir = path.resolve(e2eDir, "../backend");

loadEnv({ path: path.join(e2eDir, ".env.test.local"), quiet: true });
loadEnv({ path: path.join(e2eDir, ".env.test"), quiet: true });

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:dummy%40123@localhost:5433/helpdesk_test?schema=public";

const FRONTEND_PORT = Number(process.env.TEST_FRONTEND_PORT ?? 5174);
const BACKEND_PORT = Number(process.env.TEST_BACKEND_PORT ?? 3001);

const parsedUrl = new URL(DATABASE_URL);
const dbName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));

if (!dbName) {
  throw new Error(`TEST_DATABASE_URL is missing a database name: ${DATABASE_URL}`);
}
if (dbName === "helpdesk") {
  throw new Error(
    `Refusing to operate on the dev database "${dbName}". ` +
      `TEST_DATABASE_URL must point to a separate test database.`,
  );
}

async function ensureDatabaseExists(): Promise<void> {
  const adminUrl = new URL(DATABASE_URL);
  adminUrl.pathname = "/postgres";
  adminUrl.searchParams.delete("schema");

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rows } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`[e2e] Created test database "${dbName}"`);
    }
  } finally {
    await client.end();
  }
}

async function wipeSchema(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log(`[e2e] Reset "public" schema on "${dbName}"`);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const childEnv = {
    ...process.env,
    DATABASE_URL,
    SEED_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL ?? "admin@test.com",
    SEED_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD ?? "password123",
    SEED_AGENT_EMAIL: process.env.TEST_AGENT_EMAIL ?? "agent@test.com",
    SEED_AGENT_PASSWORD: process.env.TEST_AGENT_PASSWORD ?? "password123",
    TRUSTED_ORIGINS: `http://localhost:${FRONTEND_PORT}`,
    BETTER_AUTH_SECRET:
      process.env.TEST_BETTER_AUTH_SECRET ??
      "Y3AvJ73a5+FtSWrch/Kny2X5MebrZv6qS0PgP+iG53k=",
    BETTER_AUTH_URL: `http://localhost:${BACKEND_PORT}`,
  };

  await ensureDatabaseExists();
  await wipeSchema();

  execSync("bunx prisma migrate deploy", {
    cwd: backendDir,
    env: childEnv,
    stdio: "inherit",
  });

  execSync("bunx prisma db seed", {
    cwd: backendDir,
    env: childEnv,
    stdio: "inherit",
  });
}

main().catch((err) => {
  console.error("[e2e] setup-test-db failed:", err);
  process.exit(1);
});
