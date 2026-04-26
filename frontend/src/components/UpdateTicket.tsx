import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketDetail, Assignee, UpdateTicket as UpdateTicketInput } from "@helpdesk/core/schemas/ticket";

type Props = {
  ticketId: string;
  ticket: TicketDetail;
  agents: Assignee[];
};

export function UpdateTicket({ ticketId, ticket, agents }: Props) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTicketInput) => axios.patch(`/api/tickets/${ticketId}`, data),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(`/api/tickets/${ticketId}/assign`, { assignedToId }),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          <div className="text-sm">
            <p className="font-medium">{ticket.fromName}</p>
            <p className="font-mono text-xs text-muted-foreground">{ticket.fromEmail}</p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          <Select
            value={ticket.status}
            onValueChange={(v) => updateMutation.mutate({ status: v as TicketDetail["status"] })}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Category</CardTitle>
          <Select
            value={ticket.category ?? "none"}
            onValueChange={(v) =>
              updateMutation.mutate({ category: v === "none" ? null : v as TicketDetail["category"] })
            }
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder="Uncategorized" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              <SelectItem value="general_question">General Question</SelectItem>
              <SelectItem value="technical_question">Technical Question</SelectItem>
              <SelectItem value="refund_request">Refund Request</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Assigned to</CardTitle>
          <Select
            value={ticket.assignedTo?.id ?? "unassigned"}
            onValueChange={(v) => assignMutation.mutate(v === "unassigned" ? null : v)}
            disabled={assignMutation.isPending}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
    </div>
  );
}
