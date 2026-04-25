import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/index.ts";
import {
  inboundEmailSchema,
  ticketSortBySchema,
  ticketSortDirSchema,
  ticketStatusFilterSchema,
  ticketCategoryFilterSchema,
} from "@helpdesk/core/schemas/ticket";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

export const webhooksRouter = Router();

webhooksRouter.post("/webhooks/email", async (req: Request, res: Response) => {
  const parsed = inboundEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Invalid email payload",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
    return;
  }

  const { subject, body, fromEmail, fromName, messageId } = parsed.data;

  const ticket = messageId
    ? await prisma.ticket.upsert({
        where: { messageId },
        create: { subject, body, fromEmail, fromName, messageId },
        update: {},
      })
    : await prisma.ticket.create({
        data: { subject, body, fromEmail, fromName },
      });

  res.json({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      fromEmail: ticket.fromEmail,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
  });
});

const PAGE_SIZES = [10, 25, 50] as const;

webhooksRouter.get("/tickets", requireAuth, async (req: Request, res: Response) => {
  const sortBy = ticketSortBySchema.catch("createdAt").parse(req.query.sortBy);
  const sortDir = ticketSortDirSchema.catch("desc").parse(req.query.sortDir);
  const statusFilter = ticketStatusFilterSchema.catch("all").parse(req.query.status);
  const categoryFilter = ticketCategoryFilterSchema.catch("all").parse(req.query.category);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const pageSize = PAGE_SIZES.includes(Number(req.query.pageSize) as (typeof PAGE_SIZES)[number])
    ? Number(req.query.pageSize)
    : 10;
  const page = Math.max(1, Number(req.query.page) || 1);

  const where: Prisma.TicketWhereInput = {
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(categoryFilter !== "all" && {
      category: categoryFilter === "uncategorized" ? null : categoryFilter,
    }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { fromName: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        status: true,
        category: true,
        createdAt: true,
      },
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page, pageSize });
});
