import { Link, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

type NavbarProps = {
  user: { name: string };
};

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-8 py-4">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Helpdesk
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Signed in as <span className="font-medium text-gray-900">{user.name}</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
