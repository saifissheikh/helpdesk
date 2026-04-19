/**
 * auth.logout.spec.ts
 *
 * Covers the Sign out flow:
 * - Clicking "Sign out" navigates to /login
 * - After sign-out, visiting / redirects to /login
 * - After sign-out, GET /api/me returns 401
 * - After sign-out, the session cookie is gone from context.cookies()
 */

import { test, expect } from "../fixtures/auth";

test.describe("Sign out", () => {
  test("clicking Sign out navigates to /login", async ({ adminPage: page }) => {
    await page.goto("/");
    await expect(page.getByText(/signed in as/i)).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("after sign-out, visiting / redirects to /login", async ({
    adminPage: page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Navigate to / — ProtectedLayout should bounce us back.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("after sign-out, GET /api/me returns 401", async ({
    adminPage: page,
    request,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // The browser context's cookies have been cleared by Better Auth's sign-out.
    // Use the page's context storage state to make the API call with the same
    // (now-expired or absent) cookies.
    const storageState = await page.context().storageState();
    const apiCtx = await page.context().request;

    // Hit /api/me with no valid session — expect 401.
    const res = await apiCtx.get("/api/me");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  test("after sign-out, session cookie is absent from browser context", async ({
    adminPage: page,
  }) => {
    await page.goto("/");

    // Record the session cookie name while signed in.
    const cookiesBefore = await page.context().cookies();
    const sessionCookieBefore = cookiesBefore.find((c) =>
      c.name.toLowerCase().includes("session"),
    );
    // Sanity-check: we should have a session cookie while signed in.
    expect(sessionCookieBefore).toBeDefined();
    const sessionCookieName = sessionCookieBefore!.name;

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // After sign-out the cookie should be gone or expired/cleared.
    const cookiesAfter = await page.context().cookies();
    const sessionCookieAfter = cookiesAfter.find(
      (c) => c.name === sessionCookieName,
    );
    // Better Auth may delete the cookie or set it to empty — either way
    // it should not carry a valid token.
    expect(
      sessionCookieAfter === undefined || sessionCookieAfter.value === "",
    ).toBe(true);
  });
});
