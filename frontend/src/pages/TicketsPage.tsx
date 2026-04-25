import { TicketsTable } from "@/components/TicketsTable";

export default function TicketsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <TicketsTable />
    </div>
  );
}
