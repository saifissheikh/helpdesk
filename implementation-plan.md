# Implementation Plan

Phases are ordered so each one delivers something runnable. Non-AI ticket flow works before AI is layered on, and email comes in before AI touches it.

---

## Phase 1 — Project Foundation

Goal: empty but running frontend + backend + database.

- [ ] Initialize repo structure (`/frontend`, `/backend`, shared `README`)
- [ ] Scaffold backend: Node.js + Express + TypeScript, ESLint + Prettier
- [ ] Scaffold frontend: React + TypeScript (Vite)
- [ ] Set up PostgreSQL database

---

## Phase 2 — Authentication & User Management

Goal: admin can log in and create agents.

- [ ] Prisma models: `User` (role: admin | agent), `Session`
- [ ] Seed script that creates the initial admin user on deploy
- [ ] Password hashing (bcrypt/argon2)
- [ ] `POST /auth/login` — verify credentials, create session row, set HTTP-only cookie
- [ ] `POST /auth/logout` — destroy session
- [ ] `GET /auth/me` — return current user from session
- [ ] Auth middleware that loads session and attaches user to request
- [ ] Role-based guard middleware (admin-only routes)
- [ ] Frontend: login page + auth context/provider
- [ ] Frontend: protected route wrapper, redirect unauthenticated users
- [ ] Admin user management page: list agents, create agent, deactivate agent
- [ ] Backend routes for user CRUD (admin-only)

---

## Phase 3 — Core Ticket Management (no AI, no email)

Goal: agents can manually create, view, update, and reply to tickets in the UI.

- [ ] Prisma models: `Ticket` (status, category, subject, requester email, assignee), `TicketMessage` (author, body, direction: inbound | outbound | internal)
- [ ] Migration + seed a few sample tickets for dev
- [ ] `POST /tickets` — create ticket manually
- [ ] `GET /tickets` — list with query params for status, category, assignee, sort
- [ ] `GET /tickets/:id` — detail with messages
- [ ] `PATCH /tickets/:id` — update status, category, assignee
- [ ] `POST /tickets/:id/messages` — append a reply or internal note
- [ ] Frontend: ticket list page with filters (status, category) and sorting
- [ ] Frontend: ticket detail page showing conversation thread
- [ ] Frontend: status/category/assignee controls on detail page
- [ ] Frontend: reply composer (customer-facing vs internal note)

---

## Phase 4 — Email Integration

Goal: real emails create tickets; agent replies are emailed back.

- [ ] Choose provider (SendGrid or Mailgun) and set up inbound parse / route
- [ ] `POST /webhooks/email/inbound` — validate signature, parse payload
- [ ] Map inbound email → new ticket (or append to existing via message-id / subject threading)
- [ ] Store raw email payload for debugging
- [ ] Outbound email service: send reply when agent posts a customer-facing message
- [ ] Preserve threading headers (In-Reply-To, References) on outbound
- [ ] Handle bounces / failed sends (log + surface on ticket)
- [ ] End-to-end test: send email → ticket appears → reply → customer receives it

---

## Phase 5 — AI Features

Goal: Claude classifies, summarizes, and drafts replies.

- [ ] Install `@anthropic-ai/sdk`, add `ANTHROPIC_API_KEY` config
- [ ] AI service module with shared client + prompt-caching setup
- [ ] Knowledge base storage: markdown files in repo or `KnowledgeArticle` table
- [ ] Admin UI to create/edit knowledge articles (if DB-backed)
- [ ] Auto-classify ticket into one category on creation, store confidence
- [ ] Auto-generate ticket summary, store on ticket, refresh when new messages arrive
- [ ] Suggested reply endpoint: returns draft using ticket context + KB
- [ ] Frontend: show classification, summary, and "insert suggested reply" button on detail page
- [ ] Auto-response feature flag: when enabled and confidence high, send reply automatically and mark ticket accordingly
- [ ] Guardrails: redact PII before sending to model, log all AI calls, cap tokens

---

## Phase 6 — Dashboard, Polish, Deployment

Goal: ship-ready.

- [ ] Dashboard page: ticket counts by status and category, recent activity
- [ ] Pagination on ticket list
- [ ] Search across subject + message body
- [ ] Empty states, loading states, error toasts across UI
- [ ] Backend: input validation (zod) on every route
- [ ] Backend: rate limit auth and webhook endpoints
- [ ] Write integration tests for auth, ticket CRUD, email webhook, AI endpoints
- [ ] CI pipeline: lint, typecheck, test
- [ ] Dockerfiles for frontend and backend
- [ ] Deploy backend (Render/Fly/Railway), frontend (Vercel/Netlify), managed Postgres
- [ ] Production secrets and environment setup
- [ ] Smoke-test production end-to-end

---

## Cross-cutting (ongoing)

- [ ] Accessibility pass on key pages
- [ ] Audit log for admin actions (user create, role change)
- [ ] Monitoring: error tracking (Sentry) + structured logs
