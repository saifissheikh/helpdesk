import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.join(__dirname, ".env.test.local"), quiet: true });
loadEnv({ path: path.join(__dirname, ".env.test"), quiet: true });

const BACKEND_PORT = Number(process.env.TEST_BACKEND_PORT ?? 3001);
const FRONTEND_PORT = Number(process.env.TEST_FRONTEND_PORT ?? 5174);
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:dummy%40123@localhost:5433/helpdesk_test?schema=public";

const BETTER_AUTH_SECRET =
  process.env.TEST_BETTER_AUTH_SECRET ??
  "Y3AvJ73a5+FtSWrch/Kny2X5MebrZv6qS0PgP+iG53k=";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@test.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "password123";

// Exported so fixtures can read them without re-parsing env.
export { ADMIN_EMAIL, ADMIN_PASSWORD };
export const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL ?? "agent@test.com";
export const AGENT_PASSWORD = process.env.TEST_AGENT_PASSWORD ?? "password123";
export { BACKEND_URL, FRONTEND_URL };

const backendDir = path.resolve(__dirname, "../backend");
const frontendDir = path.resolve(__dirname, "../frontend");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",

  // DB setup runs in `scripts/setup-test-db.ts` before `playwright test`
  // (see package.json "test" script). It can't live in globalSetup because
  // Playwright waits for webServer.url to respond 2xx *before* globalSetup
  // runs, and the backend's /health check fails until the schema exists.

  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      name: "backend",
      command: "bun index.ts",
      cwd: backendDir,
      url: `${BACKEND_URL}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        DATABASE_URL,
        PORT: String(BACKEND_PORT),
        NODE_ENV: "test",
        BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: BACKEND_URL,
        TRUSTED_ORIGINS: FRONTEND_URL,
        SEED_ADMIN_EMAIL: ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      },
    },
    {
      name: "frontend",
      command: `bunx vite --port ${FRONTEND_PORT} --strictPort`,
      cwd: frontendDir,
      url: FRONTEND_URL,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        BACKEND_URL,
      },
    },
  ],
});
