import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { inboundEmailSchema } from "@helpdesk/core/schemas/ticket";
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

webhooksRouter.get("/tickets", requireAuth, async (_req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      fromName: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tickets });
});
