import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { UsersTable } from "@/components/UsersTable";

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setCreateOpen(true)}>Create User</Button>
      </div>

      <UsersTable />

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
