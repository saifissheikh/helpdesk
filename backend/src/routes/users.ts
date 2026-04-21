import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { createUserSchema, updateUserSchema } from "@helpdesk/core/schemas/user";
import { auth } from "../lib/auth.ts";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { requireAdmin } from "../middleware/requireAdmin.ts";
import { Role } from "../../generated/prisma/enums.ts";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireAdmin);

usersRouter.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

usersRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
    return;
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);
  const now = new Date();

  const user = await ctx.adapter.create<{ id: string }>({
    model: "user",
    data: {
      email,
      name,
      emailVerified: true,
      role: Role.agent,
      createdAt: now,
      updatedAt: now,
    },
  });

  await ctx.adapter.create({
    model: "account",
    data: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  const created = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({ user: created });
});

usersRouter.patch("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
    return;
  }

  const { id } = req.params;
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
  }

  await prisma.user.update({
    where: { id },
    data: { name, email },
  });

  if (password) {
    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashedPassword },
    });
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({ user: updated });
});

usersRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt !== null) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === Role.admin) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  res.status(204).send();
});
