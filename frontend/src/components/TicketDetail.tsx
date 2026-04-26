import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createMessageSchema,
  type TicketDetail as TicketDetailType,
  type Assignee,
  type TicketMessage,
  type CreateMessage,
} from "@helpdesk/core/schemas/ticket";
import { UpdateTicket } from "@/components/UpdateTicket";

type Props = {
  ticketId: string;
  ticket: TicketDetailType;
  messages: TicketMessage[];
  agents: Assignee[];
};

const directionStyles: Record<string, string> = {
  inbound: "bg-muted",
  outbound: "bg-primary/10 ml-8",
  internal: "bg-yellow-50 border border-yellow-200",
};

export function TicketDetail({ ticketId, ticket, messages, agents }: Props) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateMessage>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { body: "", direction: "outbound" },
  });
  const direction = watch("direction");

  const replyMutation = useMutation({
    mutationFn: (data: CreateMessage) => axios.post(`/api/tickets/${ticketId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
      reset();
    },
  });

  return (
    <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
      {/* Left — subject, thread, composer */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-3">
          <div className={cn("rounded-lg p-4 text-sm", directionStyles.inbound)}>
            <p className="whitespace-pre-wrap">{ticket.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {ticket.fromName} · {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn("rounded-lg p-4 text-sm", directionStyles[msg.direction])}>
              {msg.direction === "internal" && (
                <p className="mb-1 text-xs font-medium text-yellow-700 uppercase tracking-wide">Internal note</p>
              )}
              <p className="whitespace-pre-wrap">{msg.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {msg.author?.name ?? "Unknown"} · {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={direction === "outbound" ? "default" : "outline"}
                onClick={() => setValue("direction", "outbound")}
              >
                Reply
              </Button>
              <Button
                type="button"
                size="sm"
                variant={direction === "internal" ? "default" : "outline"}
                onClick={() => setValue("direction", "internal")}
              >
                Internal note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => replyMutation.mutate(data))} className="space-y-3">
              <Textarea
                {...register("body")}
                placeholder={direction === "internal" ? "Add an internal note…" : "Write a reply…"}
                rows={4}
                className={cn(errors.body && "border-destructive")}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={replyMutation.isPending} size="sm">
                  {direction === "internal" ? "Add note" : "Send reply"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right — metadata + controls */}
      <UpdateTicket ticketId={ticketId} ticket={ticket} agents={agents} />
    </div>
  );
}
