import * as z from "zod";

export const ticketStatusSchema = z.enum(["open", "resolved", "closed"]);
export const ticketCategorySchema = z.enum([
  "general_question",
  "technical_question",
  "refund_request",
]);

export const inboundEmailSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(500),
  body: z.string().trim().min(1, "Body is required"),
  fromEmail: z.email("Enter a valid email"),
  fromName: z.string().trim().min(1, "From name is required"),
  messageId: z.string().optional(),
});

export const ticketStatusFilterSchema = z.enum([
  "all",
  "open",
  "resolved",
  "closed",
]);
export const ticketCategoryFilterSchema = z.enum([
  "all",
  "general_question",
  "technical_question",
  "refund_request",
  "uncategorized",
]);
export type TicketStatusFilter = z.infer<typeof ticketStatusFilterSchema>;
export type TicketCategoryFilter = z.infer<typeof ticketCategoryFilterSchema>;

export const ticketSortBySchema = z.enum([
  "subject",
  "fromName",
  "status",
  "category",
  "createdAt",
]);
export const ticketSortDirSchema = z.enum(["asc", "desc"]);
export type TicketSortBy = z.infer<typeof ticketSortBySchema>;
export type TicketSortDir = z.infer<typeof ticketSortDirSchema>;

export const assigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.nullable().optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.string().trim().min(1, "Assignee ID must not be empty").nullable(),
});

export const ticketRowSchema = z.object({
  id: z.number(),
  subject: z.string(),
  fromEmail: z.string(),
  fromName: z.string(),
  status: ticketStatusSchema,
  category: ticketCategorySchema.nullable(),
  assignedTo: assigneeSchema.nullable(),
  createdAt: z.string(),
});

export const ticketDetailSchema = ticketRowSchema.extend({
  body: z.string(),
  updatedAt: z.string(),
});

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type InboundEmail = z.infer<typeof inboundEmailSchema>;
export type TicketRow = z.infer<typeof ticketRowSchema>;
export type TicketDetail = z.infer<typeof ticketDetailSchema>;
export const messageDirSchema = z.enum(["outbound", "internal"]);

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Reply body is required"),
  direction: messageDirSchema,
});

export const ticketMessageSchema = z.object({
  id: z.number(),
  body: z.string(),
  direction: z.enum(["inbound", "outbound", "internal"]),
  author: z.object({ id: z.string(), name: z.string() }).nullable(),
  createdAt: z.string(),
});

export type Assignee = z.infer<typeof assigneeSchema>;
export type AssignTicket = z.infer<typeof assignTicketSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
export type TicketMessage = z.infer<typeof ticketMessageSchema>;
export type CreateMessage = z.infer<typeof createMessageSchema>;
