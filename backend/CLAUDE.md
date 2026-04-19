# Backend conventions

This package is the Express backend for the helpdesk ticket management system.

## Runtime and tooling

- Runtime: **Bun** — use `bun <file>` instead of `node <file>` or `ts-node <file>`.
- Install: `bun install` / `bun add` — not npm/yarn/pnpm.
- Scripts: `bun run <script>`.
- Tests: `bun test`.
- Execute binaries with `bunx`.
- Bun auto-loads `.env`, so avoid `dotenv`.

## Chosen stack (do not replace)

The project intentionally uses **Express 5** for the HTTP server — do not swap it for `Bun.serve()`. The reason is ecosystem fit: middleware for sessions, validation, and email webhooks is richer on Express, and the tech-stack.md at the repo root locks this in.

Other intentional choices:

- **PostgreSQL + Prisma** for persistence — do not use `bun:sqlite` or `Bun.sql` here.
- **Database-backed sessions** for auth (not JWTs).
- **SendGrid or Mailgun** for inbound/outbound email.
- **Anthropic Claude** via `@anthropic-ai/sdk` for AI features.

The frontend is a separate Vite + React app at `../frontend` — do not migrate it to Bun HTML imports.

If you think a Bun-native API would be a better fit for a new feature, raise it with the user before switching — don't silently replace an existing choice.

## Authentication

Auth is handled by **Better Auth** (`better-auth`) with the **Prisma adapter** against PostgreSQL. Sessions are database-backed and delivered via HTTP-only cookies — no JWTs.

- Config lives in `src/lib/auth.ts` (exports `auth`). `emailAndPassword` is enabled with `disableSignUp: true` (users are created out-of-band; there's no public signup endpoint). `trustedOrigins` is required and read from `TRUSTED_ORIGINS` (comma-separated); the app throws at boot if it's missing.
- A `role` additional field is stored on the user (`Role` enum from the Prisma client — `agent` by default, `input: false` so clients can't set it).
- Better Auth routes are mounted before `express.json()` via `app.all("/api/auth/*splat", toNodeHandler(auth))` — do not move it below body-parsing middleware or Better Auth will fail to parse requests.
- Protect routes with `requireAuth` from `src/middleware/requireAuth.ts`. It reads the session via `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, 401s on no session, and populates `req.user` / `req.session` for downstream handlers (types are augmented in the middleware file).
- For role-based authorization, branch on `req.user.role` inside handlers or add a thin `requireRole("admin")` wrapper — don't reimplement session lookup.
- Frontend uses `better-auth/react` (`authClient`) hitting same-origin `/api/auth/*` through the Vite proxy; cookies flow automatically.
- New env vars: set `TRUSTED_ORIGINS` (e.g. `http://localhost:5173`) and any Better Auth secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) in `backend/.env` — Bun autoloads it.

### Seeding users

Because `disableSignUp: true` locks the public `/api/auth/sign-up/email` route, users must be created out-of-band. Use the seed script:

```bash
bun run scripts/create-user.ts <email> <password> [name] [role]
# e.g.
bun run scripts/create-user.ts admin@example.com 'str0ng!pw' 'Admin' admin
```
