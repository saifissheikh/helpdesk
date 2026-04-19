# Helpdesk — Project Memory

AI-powered ticket management system. Support emails become tickets; Claude classifies, summarizes, and suggests replies.

## Canonical docs (read first)

- `project-scope.md` — product scope, statuses, categories, roles
- `tech-stack.md` — locked-in technology choices
- `implementation-plan.md` — phased task list; keep it updated as work completes

## Structure

```
backend/    Express 5 + TypeScript on Bun                   (port 3000)
frontend/   React 19 + Vite 8 + TS + Tailwind 4 + shadcn/ui (port 5173)
            + React Router 7 + React Hook Form + Zod
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
- UI: **shadcn/ui** (radix/nova preset, `neutral` base color, CSS variables) — components live in `frontend/src/components/ui/`, `@/` is aliased to `frontend/src/`
- Forms: **React Hook Form** + **Zod** via `@hookform/resolvers/zod`

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
- For UI, prefer shadcn components from `@/components/ui/` (Button, Input, Label, Card, …) over hand-rolled markup; add new ones with `bunx --bun shadcn@latest add <name>`. Use theme tokens (`bg-primary`, `text-destructive`, `border-input`, `text-muted-foreground`) instead of hardcoded palette classes like `bg-blue-600` / `text-red-700` so dark mode stays consistent.
- Compose classNames via `cn` from `@/lib/utils`.
- Auth-gated routes live under `<ProtectedLayout>`; admin-only routes nest inside `<AdminRoute>` (`frontend/src/components/AdminRoute.tsx`), which redirects non-admins to `/`. The navbar hides admin-only links based on `user.role === "admin"`. Route guards are UI-only — always enforce the same rule on the server too.
- Server code: validate at system boundaries (HTTP in, email in, AI in), trust internal calls.
