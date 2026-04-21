import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Role } from "@helpdesk/core/schemas/user";

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session) return <Navigate to="/login" replace />;
  if ((session.user as { role?: string }).role !== Role.admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
