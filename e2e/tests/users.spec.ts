/**
 * users.spec.ts
 *
 * Happy-path e2e tests for the user management feature at /users.
 * Covers: list, create, edit, and delete.
 *
 * All tests use the `adminPage` fixture (pre-authenticated as admin@test.com).
 * Each test is fully independent — unique emails via Date.now() prevent
 * cross-run collisions when running against the same test database.
 */

import { test, expect } from "../fixtures/auth";
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to /users and wait for the table to finish loading.
 * The table renders skeleton rows while the query is in flight; we wait
 * until the skeleton cells are gone (i.e., the first real cell is visible).
 */
async function gotoUsersPage(page: Page) {
  await page.goto("/users");
  // Wait for the loading skeletons to be replaced by actual table content.
  // The Name column header is always visible once the table renders.
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  // And at least one data row exists (seeded admin is always present).
  await expect(page.getByRole("cell", { name: /admin@test\.com/i })).toBeVisible();
}

/**
 * Fill and submit the UserFormDialog to create a new user.
 * Caller must have already opened the dialog (e.g. clicked "Create User").
 */
async function fillUserForm(
  page: Page,
  { name, email, password }: { name: string; email: string; password?: string },
) {
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  if (password !== undefined) {
    await page.getByLabel("Password").fill(password);
  }
}

/**
 * Create a brand-new agent user via the Create User dialog and wait for
 * the table to reflect the new row.  Returns the values used so callers
 * can assert or reference them.
 */
async function createUser(
  page: Page,
  name: string,
  email: string,
  password: string,
) {
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(
    page.getByRole("heading", { name: /create user/i }),
  ).toBeVisible();

  await fillUserForm(page, { name, email, password });

  await page.getByRole("button", { name: /^create$/i }).click();

  // Dialog should close on success.
  await expect(
    page.getByRole("heading", { name: /create user/i }),
  ).not.toBeVisible();

  // New row must appear in the table.
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

test.describe("Users page — list", () => {
  test("admin can navigate to /users and sees the seeded admin in the table", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");

    // Page heading
    await expect(
      adminPage.getByRole("heading", { name: /^users$/i }),
    ).toBeVisible();

    // Table column headers
    await expect(
      adminPage.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole("columnheader", { name: "Email" }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole("columnheader", { name: "Role" }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole("columnheader", { name: "Created" }),
    ).toBeVisible();

    // Seeded admin row is present
    await expect(
      adminPage.getByRole("cell", { name: /admin@test\.com/i }),
    ).toBeVisible();

    // Seeded agent row is present
    await expect(
      adminPage.getByRole("cell", { name: /agent@test\.com/i }),
    ).toBeVisible();

    // "Create User" button is rendered
    await expect(
      adminPage.getByRole("button", { name: /create user/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

test.describe("Users page — create", () => {
  test("admin creates a new agent user and the user appears in the table", async ({
    adminPage,
  }) => {
    const email = `user-create-${Date.now()}@test.com`;
    const name = "Test Agent";

    await gotoUsersPage(adminPage);

    // Open the dialog
    await adminPage.getByRole("button", { name: /create user/i }).click();

    // Dialog title and description are visible
    await expect(
      adminPage.getByRole("heading", { name: /create user/i }),
    ).toBeVisible();
    await expect(
      adminPage.getByText(/add a new agent to the helpdesk/i),
    ).toBeVisible();

    // Fill in the form
    await fillUserForm(adminPage, {
      name,
      email,
      password: "Password123!",
    });

    // Submit
    await adminPage.getByRole("button", { name: /^create$/i }).click();

    // Dialog dismisses on success
    await expect(
      adminPage.getByRole("heading", { name: /create user/i }),
    ).not.toBeVisible();

    // New user appears in the table
    await expect(adminPage.getByRole("cell", { name })).toBeVisible();
    await expect(adminPage.getByRole("cell", { name: email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------------

test.describe("Users page — edit", () => {
  test("admin edits a user's name and email, updated values appear in the table", async ({
    adminPage,
  }) => {
    const originalEmail = `user-edit-${Date.now()}@test.com`;
    const originalName = "Edit Before";
    const updatedEmail = `user-edited-${Date.now()}@test.com`;
    const updatedName = "Edit After";

    await gotoUsersPage(adminPage);

    // Create a user to edit so this test is self-contained.
    await createUser(adminPage, originalName, originalEmail, "Password123!");

    // Click the pencil icon for the new user
    await adminPage
      .getByRole("button", { name: `Edit ${originalName}` })
      .click();

    // Dialog opens pre-filled in edit mode
    await expect(
      adminPage.getByRole("heading", { name: /edit user/i }),
    ).toBeVisible();

    // Name and email are pre-populated
    await expect(adminPage.getByLabel("Name")).toHaveValue(originalName);
    await expect(adminPage.getByLabel("Email")).toHaveValue(originalEmail);

    // Update name and email
    await adminPage.getByLabel("Name").clear();
    await adminPage.getByLabel("Name").fill(updatedName);
    await adminPage.getByLabel("Email").clear();
    await adminPage.getByLabel("Email").fill(updatedEmail);

    // Submit
    await adminPage.getByRole("button", { name: /^save$/i }).click();

    // Dialog closes
    await expect(
      adminPage.getByRole("heading", { name: /edit user/i }),
    ).not.toBeVisible();

    // Updated values appear in the table
    await expect(adminPage.getByRole("cell", { name: updatedName })).toBeVisible();
    await expect(
      adminPage.getByRole("cell", { name: updatedEmail }),
    ).toBeVisible();

    // Old values are gone
    await expect(
      adminPage.getByRole("cell", { name: originalName }),
    ).not.toBeVisible();
    await expect(
      adminPage.getByRole("cell", { name: originalEmail }),
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

test.describe("Users page — delete", () => {
  test("admin deletes a user and the user disappears from the table", async ({
    adminPage,
  }) => {
    const email = `user-delete-${Date.now()}@test.com`;
    const name = "Delete Me";

    await gotoUsersPage(adminPage);

    // Create a user to delete so this test is self-contained.
    await createUser(adminPage, name, email, "Password123!");

    // Click the trash icon for the new user
    await adminPage.getByRole("button", { name: `Delete ${name}` }).click();

    // Confirmation dialog appears
    await expect(
      adminPage.getByRole("heading", { name: /delete user\?/i }),
    ).toBeVisible();

    // Confirm deletion
    await adminPage.getByRole("button", { name: /^delete$/i }).click();

    // Dialog closes and the user row is removed
    await expect(
      adminPage.getByRole("heading", { name: /delete user\?/i }),
    ).not.toBeVisible();
    await expect(
      adminPage.getByRole("cell", { name: email }),
    ).not.toBeVisible();
  });

  test("admin user row has no delete button", async ({ adminPage }) => {
    await gotoUsersPage(adminPage);

    // The seeded admin's name is "Admin" — there should be no delete button for it.
    await expect(
      adminPage.getByRole("button", { name: /delete admin/i }),
    ).not.toBeVisible();

    // But the edit button IS present for admins (only delete is suppressed).
    await expect(
      adminPage.getByRole("button", { name: /edit admin/i }),
    ).toBeVisible();
  });
});
