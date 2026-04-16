# Helpdesk

AI-powered ticket management system.

See `project-scope.md` for the product scope, `tech-stack.md` for technology choices, and `implementation-plan.md` for the phased build plan.

## Structure

```
backend/    Express 5 + TypeScript, run on Bun
frontend/   React 19 + TypeScript + Vite + Tailwind v4 + React Router 7
```

## Prerequisites

- [Bun](https://bun.sh) 1.3+

## Install

```bash
cd backend && bun install
cd ../frontend && bun install
```

## Run in development

In two terminals:

```bash
# terminal 1 — backend on http://localhost:3000
cd backend
bun run dev
```

```bash
# terminal 2 — frontend on http://localhost:5173
cd frontend
bun run dev
```

The Vite dev server proxies `/api/*` to the backend, so the frontend can call `fetch("/api/hello")` without CORS.

## Useful endpoints

- `GET http://localhost:3000/health` — liveness check
- `GET http://localhost:3000/api/hello` — demo endpoint

## Scripts

### backend

- `bun run dev` — start Express with hot reload
- `bun run start` — start Express without hot reload
- `bun run typecheck` — TypeScript check only

### frontend

- `bun run dev` — Vite dev server
- `bun run build` — type-check and build for production
- `bun run preview` — preview the production build
- `bun run lint` — ESLint
