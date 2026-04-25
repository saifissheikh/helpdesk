import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Link } from "react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  TicketRow,
  TicketStatusFilter,
  TicketCategoryFilter,
} from "@helpdesk/core/schemas/ticket";

const PAGE_SIZES = [10, 25, 50] as const;

const statusClasses: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

function formatCategory(category: string | null): string {
  if (!category) return "—";
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const columnHelper = createColumnHelper<TicketRow>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="font-medium hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("fromName", {
    header: "From",
    cell: (info) => (
      <div>
        <div className="text-sm">{info.getValue()}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {info.row.original.fromEmail}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
          statusClasses[info.getValue()],
        )}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className="text-sm">{formatCategory(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("assignedTo", {
    header: "Assigned",
    cell: (info) => (
      <span className="text-sm">
        {info.getValue()?.name ?? <span className="text-muted-foreground">—</span>}
      </span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
];

export function TicketsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategoryFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (searchInput.trim() === "") {
      setSearch("");
      return;
    }
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortDir, statusFilter, categoryFilter, search, page, pageSize],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ tickets: TicketRow[]; total: number; page: number; pageSize: number }>(
        "/api/tickets",
        {
          params: { sortBy, sortDir, status: statusFilter, category: categoryFilter, search, page, pageSize },
          signal,
        },
      );
      return res.data;
    },
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          Could not load tickets: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="pl-8 w-56"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TicketStatusFilter); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as TicketCategoryFilter); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="general_question">General Question</SelectItem>
            <SelectItem value="technical_question">Technical Question</SelectItem>
            <SelectItem value="refund_request">Refund Request</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== "all" || categoryFilter !== "all" || searchInput) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
              setSearchInput("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-medium"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? (
                      <ArrowUp className="ml-1 h-3.5 w-3.5" />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ArrowDown className="ml-1 h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                No tickets match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span>
            {total === 0 ? "No results" : `${from}–${to} of ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
