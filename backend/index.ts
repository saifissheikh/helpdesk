import express, { type Request, type Response } from "express";
import { prisma } from "./src/lib/prisma.ts";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok", uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      db: "unreachable",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from the helpdesk backend" });
});

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing server and DB connection`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
