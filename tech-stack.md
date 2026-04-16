# Tech Stack

## Frontend

- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for client-side routing

## Backend

- **Node.js** with **Express**
- **TypeScript**

## Email

- **SendGrid** or **Mailgun** for inbound email ingestion and outbound replies

## Authentication

- **Database-backed sessions** (session records stored in the database, session ID in an HTTP-only cookie)

## Database

- **PostgreSQL** — relational store for users, tickets, categories, sessions, and ticket history

## ORM

- **Prisma** — type-safe queries and migrations, strong TypeScript integration

## AI

- **Anthropic Claude** (via the official `@anthropic-ai/sdk`) — used for ticket classification, summaries, and suggested replies
