/**
 * webhooks.spec.ts
 *
 * API-level tests for the inbound email webhook and the tickets list endpoint.
 * No browser UI is exercised — all assertions are against JSON responses.
 *
 * Endpoints under test:
 *   POST /api/webhooks/email  — unauthenticated, converts an inbound email into
 *                               a ticket.  Validated by `inboundEmailSchema`.
 *   GET  /api/tickets         — auth-gated, returns tickets ordered by createdAt
 *                               desc.
 *
 * All POST tests use Playwright's `request` fixture pointed directly at the
 * backend (BACKEND_URL, port 3001) since the webhook bypasses the Vite proxy.
 * The authenticated GET test uses `adminPage` (browser context with cookies)
 * going through the Vite proxy at /api/tickets.
 *
 * Unique subjects / messageIds are stamped with Date.now() to prevent
 * cross-run collisions against the shared test database.
 */

import { test as base, expect, request as playwrightRequest } from "@playwright/test";
import { test as authTest } from "../fixtures/auth";
import { BACKEND_URL } from "../playwright.config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid inbound email payload with unique defaults. */
function validPayload(overrides: Record<string, unknown> = {}) {
  const ts = Date.now();
  return {
    subject: `Test ticket ${ts}`,
    body: "Please help me with this issue.",
    fromEmail: `customer-${ts}@example.com`,
    fromName: "Test Customer",
    ...overrides,
  };
}

/** POST to /api/webhooks/email against the backend directly (no auth cookie). */
async function postWebhook(
  apiCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  body: Record<string, unknown>,
) {
  return apiCtx.post(`${BACKEND_URL}/api/webhooks/email`, { data: body });
}

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

base.describe("POST /api/webhooks/email — happy paths", () => {
  let apiCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>;

  base.beforeEach(async () => {
    // Fresh context with no cookies — the webhook is unauthenticated.
    apiCtx = await playwrightRequest.newContext();
  });

  base.afterEach(async () => {
    await apiCtx.dispose();
  });

  base(
    "valid payload returns 200 with a ticket that has a numeric id and status open",
    async () => {
      const res = await postWebhook(apiCtx, validPayload());

      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("ticket");

      const { ticket } = body;
      // id must be a number (auto-increment int, not a cuid string)
      expect(typeof ticket.id).toBe("number");
      expect(ticket.id).toBeGreaterThan(0);

      expect(ticket.status).toBe("open");
      expect(typeof ticket.subject).toBe("string");
      expect(typeof ticket.fromEmail).toBe("string");
      expect(typeof ticket.createdAt).toBe("string");
    },
  );

  base(
    "POSTing the same messageId twice is idempotent — returns the same ticket id both times",
    async () => {
      const messageId = `msg-idempotent-${Date.now()}`;
      const payload = validPayload({ messageId });

      const res1 = await postWebhook(apiCtx, payload);
      expect(res1.status()).toBe(200);
      const { ticket: ticket1 } = await res1.json();

      const res2 = await postWebhook(apiCtx, payload);
      expect(res2.status()).toBe(200);
      const { ticket: ticket2 } = await res2.json();

      // Upsert on messageId — both responses must resolve to the same DB row.
      expect(ticket2.id).toBe(ticket1.id);
    },
  );

  base(
    "POSTing without a messageId twice creates two distinct tickets",
    async () => {
      const res1 = await postWebhook(apiCtx, validPayload());
      expect(res1.status()).toBe(200);
      const { ticket: ticket1 } = await res1.json();

      const res2 = await postWebhook(apiCtx, validPayload());
      expect(res2.status()).toBe(200);
      const { ticket: ticket2 } = await res2.json();

      // Each call without messageId must produce a new row.
      expect(ticket2.id).not.toBe(ticket1.id);
    },
  );
});

// ---------------------------------------------------------------------------
// Integration: webhook → GET tickets
// ---------------------------------------------------------------------------

// This group needs both an unauthenticated request context (for the POST) and
// an authenticated browser page (for the GET), so we extend the auth fixture.
authTest.describe("Webhook → GET /api/tickets integration", () => {
  authTest(
    "ticket created via webhook appears in the authenticated ticket list",
    async ({ adminPage }) => {
      // POST the webhook directly against the backend.
      const apiCtx = await playwrightRequest.newContext();

      const ts = Date.now();
      const subject = `Integration ticket ${ts}`;
      const fromEmail = `integration-${ts}@example.com`;

      const res = await postWebhook(apiCtx, validPayload({ subject, fromEmail }));
      expect(res.status()).toBe(200);
      const { ticket: created } = await res.json();

      await apiCtx.dispose();

      // GET /api/tickets via the Vite proxy (adminPage goes through port 5174).
      const apiRes = await adminPage.request.get("/api/tickets");
      expect(apiRes.status()).toBe(200);

      const { tickets } = await apiRes.json();
      expect(Array.isArray(tickets)).toBe(true);

      const found = tickets.find(
        (t: { id: number }) => t.id === created.id,
      );
      expect(found).toBeDefined();
      expect(found.subject).toBe(subject);
      expect(found.fromEmail).toBe(fromEmail);
      expect(found.status).toBe("open");
      // Tickets list also exposes fromName and category
      expect(typeof found.fromName).toBe("string");
    },
  );
});

// ---------------------------------------------------------------------------
// Validation failures — expect 422 with fieldErrors
// ---------------------------------------------------------------------------

base.describe("POST /api/webhooks/email — validation failures", () => {
  let apiCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>;

  base.beforeEach(async () => {
    apiCtx = await playwrightRequest.newContext();
  });

  base.afterEach(async () => {
    await apiCtx.dispose();
  });

  base("missing subject → 422 with fieldError on subject", async () => {
    const payload = validPayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).subject;

    const res = await postWebhook(apiCtx, payload);

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body).toHaveProperty("fieldErrors");
    expect(body.fieldErrors).toHaveProperty("subject");
  });

  base(
    "missing fromName (newly required field) → 422 with fieldError on fromName",
    async () => {
      const payload = validPayload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (payload as any).fromName;

      const res = await postWebhook(apiCtx, payload);

      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body).toHaveProperty("fieldErrors");
      expect(body.fieldErrors).toHaveProperty("fromName");
    },
  );

  base("invalid fromEmail → 422 with fieldError on fromEmail", async () => {
    const res = await postWebhook(
      apiCtx,
      validPayload({ fromEmail: "not-an-email" }),
    );

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body).toHaveProperty("fieldErrors");
    expect(body.fieldErrors).toHaveProperty("fromEmail");
  });

  base(
    "whitespace-only body (empty after trim) → 422 with fieldError on body",
    async () => {
      const res = await postWebhook(apiCtx, validPayload({ body: "   " }));

      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body).toHaveProperty("fieldErrors");
      expect(body.fieldErrors).toHaveProperty("body");
    },
  );
});

// ---------------------------------------------------------------------------
// Auth gate on GET /api/tickets
// ---------------------------------------------------------------------------

base.describe("GET /api/tickets — auth gate", () => {
  base(
    "unauthenticated request → 401",
    async () => {
      // Hit the backend directly with no cookies.
      const apiCtx = await playwrightRequest.newContext();

      const res = await apiCtx.get(`${BACKEND_URL}/api/tickets`);

      expect(res.status()).toBe(401);

      await apiCtx.dispose();
    },
  );
});
