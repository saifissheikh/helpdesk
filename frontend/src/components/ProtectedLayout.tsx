import { Navigate, Outlet } from "react-router";
import { authClient } from "../lib/auth-client";
import Navbar from "./Navbar";

export default function ProtectedLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p className="p-8 text-gray-600">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar user={session.user} />
      <main className="max-w-7xl mx-auto p-8">
        <Outlet />
      </main>
    </>
  );
}
