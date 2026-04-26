import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketDetail } from "@/components/TicketDetail";
import type { TicketDetail as TicketDetailType, Assignee, TicketMessage } from "@helpdesk/core/schemas/ticket";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ ticket: TicketDetailType }>(`/api/tickets/${id}`, { signal });
      return res.data.ticket;
    },
    enabled: !!id,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["ticket-messages", id],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ messages: TicketMessage[] }>(`/api/tickets/${id}/messages`, { signal });
      return res.data.messages;
    },
    enabled: !!id,
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agents"],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ agents: Assignee[] }>("/api/agents", { signal });
      return res.data.agents;
    },
  });

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tickets
      </Link>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Could not load ticket: {error.message}
          </CardContent>
        </Card>
      ) : isPending ? (
        <div className="grid grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <TicketDetail
          ticketId={id!}
          ticket={ticket}
          messages={messagesData ?? []}
          agents={agentsData ?? []}
        />
      )}
    </div>
  );
}
