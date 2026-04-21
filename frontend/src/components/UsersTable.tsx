import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EditableUser } from "@/components/UserFormDialog";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
};

type UsersTableProps = {
  onEdit: (user: EditableUser) => void;
};

export function UsersTable({ onEdit }: UsersTableProps) {
  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: async ({ signal }) => {
      const res = await axios.get<{ users: UserRow[] }>("/api/users", {
        signal,
      });
      return res.data.users;
    },
  });

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          Could not load users: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-16 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-56" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-7 w-7" />
              </TableCell>
            </TableRow>
          ))
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-8 text-center text-muted-foreground"
            >
              No users found.
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell className="font-mono text-sm">{u.email}</TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
              <TableCell>
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${u.name}`}
                  onClick={() =>
                    onEdit({ id: u.id, name: u.name, email: u.email })
                  }
                >
                  <Pencil />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
