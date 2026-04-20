import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth.ts";
import { requireAuth } from "./src/middleware/requireAuth.ts";
import { prisma } from "./src/lib/prisma.ts";
import { usersRouter } from "./src/routes/users.ts";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(helmet());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok", uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      db: "unreachable",
      ...(isProduction
        ? {}
        : { error: err instanceof Error ? err.message : String(err) }),
    });
  }
});

app.get("/api/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.use("/api/users", usersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    ...(isProduction
      ? {}
      : { detail: err instanceof Error ? err.message : String(err) }),
  });
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
