/**
 * auth.role-gating.spec.ts
 *
 * Covers role-based access control (both UI guard and implicit server guard):
 * - Admin can access /users
 * - Non-admin (agent) visiting /users is redirected to /
 * - Navbar shows Users link only for admin
 */

import { test, expect } from "../fixtures/auth";

test.describe("Admin-only route guard (/users)", () => {
  test("admin can navigate to /users and see the Users heading", async ({
    adminPage: page,
  }) => {
    await page.goto("/users");
    // AdminRoute should render UsersPage without redirecting.
    await expect(page).toHaveURL("/users");
    await expect(
      page.getByRole("heading", { name: /^users$/i }),
    ).toBeVisible();
  });

  test("agent navigating directly to /users is redirected to /", async ({
    agentPage: page,
  }) => {
    // Use direct navigation (not clicking a link — agents don't see the link).
    await page.goto("/users");
    // AdminRoute: no session → /login; role !== admin → /.
    // The agent has a valid session so AdminRoute sends them to /.
    await expect(page).toHaveURL("/");
  });
});

test.describe("Navbar role visibility", () => {
  test("admin navbar shows Dashboard and Users links", async ({
    adminPage: page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^users$/i })).toBeVisible();
  });

  test("agent navbar shows Dashboard but NOT Users link", async ({
    agentPage: page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^users$/i }),
    ).not.toBeVisible();
  });

  test("admin navbar shows 'Signed in as Admin'", async ({
    adminPage: page,
  }) => {
    await page.goto("/");
    // The Navbar renders: "Signed in as <span>Admin</span>"
    await expect(page.getByText(/signed in as/i)).toBeVisible();
    // The seeded admin user's name is "Admin" (set in seed.ts).
    await expect(
      page.getByText("Admin", { exact: true }),
    ).toBeVisible();
  });

  test("agent navbar shows 'Signed in as Agent'", async ({
    agentPage: page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/signed in as/i)).toBeVisible();
    // The seeded agent user's name is "Agent" (set in global-setup seed).
    await expect(
      page.getByText("Agent", { exact: true }),
    ).toBeVisible();
  });
});
