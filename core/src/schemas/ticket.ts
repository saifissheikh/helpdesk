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

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type InboundEmail = z.infer<typeof inboundEmailSchema>;
