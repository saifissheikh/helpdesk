/**
 * auth.ts — Playwright fixtures for pre-authenticated test contexts.
 *
 * Instead of logging in via the UI in every test, we log in once per role
 * using the API directly (POST /api/auth/sign-in/email through the Vite proxy)
 * and save the resulting cookies as storageState. Since workers: 1, there is
 * exactly one worker; we still scope to the worker for clarity and future-proofing.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/auth";
 *   // test now has `adminPage` and `agentPage` fixtures in scope.
 *   test("...", async ({ adminPage }) => { ... });
 */

import { test as base, request, expect } from "@playwright/test";
import path from "node:path";

// Pull defaults from env vars that playwright.config.ts injected (or fall back).
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@test.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "password123";
const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL ?? "agent@test.com";
const AGENT_PASSWORD = process.env.TEST_AGENT_PASSWORD ?? "password123";

// Sign in via the API and return a storageState object (not a cached file).
// Called fresh for every test so a sign-out in one test can never poison
// the session used by a later test.
async function acquireStorageState(
  outputDir: string,
  role: "admin" | "agent",
  email: string,
  password: string,
): Promise<string> {
  // Use a fresh API context with no prior cookies.
  const ctx = await request.newContext({ storageState: undefined });

  const res = await ctx.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });

  // Surface a clear error if the login fails before every test that depends on it.
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `[auth fixture] Failed to sign in as ${role} (${email}). ` +
        `Status: ${res.status()}. Body: ${body}`,
    );
  }

  // Write fresh cookies to a per-test temp file (unique by role + parallelIndex + time).
  const id = base.info().parallelIndex;
  const fileName = path.resolve(
    outputDir,
    `.auth/${role}-${id}-${Date.now()}.json`,
  );
  await ctx.storageState({ path: fileName });
  await ctx.dispose();

  return fileName;
}

// ---------------------------------------------------------------------------
// Extended test with convenience fixtures
// ---------------------------------------------------------------------------

type AuthFixtures = {
  /** A Page already signed in as the seeded admin user. */
  adminPage: import("@playwright/test").Page;
  /** A Page already signed in as the seeded agent user. */
  agentPage: import("@playwright/test").Page;
};

// No worker-scoped fixtures: each test acquires a fresh session so that a
// sign-out in one test cannot invalidate the session used by any later test.
export const test = base.extend<AuthFixtures>({
  // Test-scoped: sign in fresh for every test. The extra POST /api/auth/sign-in/email
  // costs ~10–30 ms and eliminates the stale-session class of bug entirely.
  adminPage: async ({ browser }, use) => {
    const outputDir = base.info().project.outputDir;
    const statePath = await acquireStorageState(
      outputDir,
      "admin",
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    );
    const ctx = await browser.newContext({ storageState: statePath });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  agentPage: async ({ browser }, use) => {
    const outputDir = base.info().project.outputDir;
    const statePath = await acquireStorageState(
      outputDir,
      "agent",
      AGENT_EMAIL,
      AGENT_PASSWORD,
    );
    const ctx = await browser.newContext({ storageState: statePath });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect };
