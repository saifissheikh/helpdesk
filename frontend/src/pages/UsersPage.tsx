import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  UserFormDialog,
  type UserFormMode,
} from "@/components/UserFormDialog";
import { UsersTable } from "@/components/UsersTable";

export default function UsersPage() {
  const [dialogState, setDialogState] = useState<UserFormMode | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          Create User
        </Button>
      </div>

      <UsersTable
        onEdit={(user) => setDialogState({ mode: "edit", user })}
      />

      <UserFormDialog
        state={dialogState}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
      />
    </div>
  );
}
