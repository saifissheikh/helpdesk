# Helpdesk — Project Memory

AI-powered ticket management system. Support emails become tickets; Claude classifies, summarizes, and suggests replies.

## Canonical docs (read first)

- `project-scope.md` — product scope, statuses, categories, roles
- `tech-stack.md` — locked-in technology choices
- `implementation-plan.md` — phased task list; keep it updated as work completes

## Structure

```
backend/    Express 5 + TypeScript on Bun       (port 3000)
frontend/   React 19 + Vite 8 + TS + Tailwind 4 (port 5173)
            + React Router 7
```

`backend/CLAUDE.md` has backend-specific runtime conventions.

## Stack (do not swap without asking)

- Runtime: **Bun** for both apps (install, scripts, hot reload)
- Backend: **Express 5** — not `Bun.serve()`
- Frontend: **Vite** — not Bun HTML imports
- DB: **PostgreSQL** + **Prisma**
- Auth: **database-backed sessions** (HTTP-only cookies), not JWT
- Email: **SendGrid** or **Mailgun** for inbound/outbound
- AI: **Anthropic Claude** via `@anthropic-ai/sdk`

## Development commands

```bash
# install
cd backend && bun install
cd frontend && bun install

# run (two terminals)
cd backend && bun run dev      # http://localhost:3000
cd frontend && bun run dev     # http://localhost:5173
```

Vite proxies `/api` and `/health` → backend, so the browser calls same-origin.

## Fetching library documentation

Use the **Context7 MCP server** to pull current docs for any library, framework, SDK, or CLI tool before writing non-trivial code against it — Bun, Express, Vite, Prisma, Tailwind, React Router, Anthropic SDK, SendGrid/Mailgun, etc.

Flow:

1. `mcp__context7__resolve-library-id` with the library name to get the Context7 ID
2. `mcp__context7__query-docs` with that ID and a specific question

Prefer Context7 over web search and over training-data recall — APIs drift. Skip it only for general programming questions, refactors, or debugging business logic.

## Working conventions

- Keep `implementation-plan.md` phases honest: non-AI ticket flow must work before AI is layered on; email ingestion before AI touches it.
- When adding new features, check which phase they belong to and whether prerequisites are done.
- Default to Tailwind utility classes for styling; avoid new CSS files.
- Server code: validate at system boundaries (HTTP in, email in, AI in), trust internal calls.
