import type { FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../backend");

async function ensureDatabaseExists(connectionUrl: string): Promise<void> {
  const parsed = new URL(connectionUrl);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!dbName) {
    throw new Error(`TEST_DATABASE_URL is missing a database name: ${connectionUrl}`);
  }

  // Connect to the "postgres" maintenance DB with the same credentials so we
  // can CREATE DATABASE if the test DB does not exist yet.
  const adminUrl = new URL(connectionUrl);
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
      // CREATE DATABASE cannot be parameterized; dbName comes from our env.
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`[e2e] Created test database "${dbName}"`);
    } else {
      console.log(`[e2e] Test database "${dbName}" already exists`);
    }
  } finally {
    await client.end();
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:dummy%40123@localhost:5433/helpdesk_test?schema=public";

  const FRONTEND_PORT = Number(process.env.TEST_FRONTEND_PORT ?? 5174);
  const BACKEND_PORT = Number(process.env.TEST_BACKEND_PORT ?? 3001);

  const env = {
    ...process.env,
    DATABASE_URL,
    SEED_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL ?? "admin@test.com",
    SEED_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD ?? "password123",
    TRUSTED_ORIGINS: `http://localhost:${FRONTEND_PORT}`,
    BETTER_AUTH_SECRET:
      process.env.TEST_BETTER_AUTH_SECRET ??
      "Y3AvJ73a5+FtSWrch/Kny2X5MebrZv6qS0PgP+iG53k=",
    BETTER_AUTH_URL: `http://localhost:${BACKEND_PORT}`,
  };

  await ensureDatabaseExists(DATABASE_URL);

  // Drop + recreate schema and replay migrations for a clean test DB.
  execSync("bunx prisma migrate reset --force --skip-seed", {
    cwd: backendDir,
    env,
    stdio: "inherit",
  });

  // Seed the admin user used by authenticated tests.
  execSync("bunx prisma db seed", {
    cwd: backendDir,
    env,
    stdio: "inherit",
  });
}
