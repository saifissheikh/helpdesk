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
