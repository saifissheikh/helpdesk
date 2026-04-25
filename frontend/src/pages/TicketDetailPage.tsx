import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TicketDetail, Assignee } from "@helpdesk/core/schemas/ticket";

const statusClasses: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

function formatCategory(category: string | null): string {
  if (!category) return "Uncategorized";
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ ticket: TicketDetail }>(`/api/tickets/${id}`, { signal });
      return res.data.ticket;
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
  const agents = agentsData ?? [];

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(`/api/tickets/${id}/assign`, { assignedToId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <div className="p-6 max-w-3xl space-y-6">
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
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  statusClasses[ticket.status],
                )}
              >
                {ticket.status}
              </span>
              <span>{formatCategory(ticket.category)}</span>
              <span>·</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
                <div className="text-sm">
                  <span className="font-medium">{ticket.fromName}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{ticket.fromEmail}</span>
                </div>
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
                  <SelectTrigger className="h-8 text-sm">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
