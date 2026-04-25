import { Route, Routes } from "react-router";
import AdminRoute from "./components/AdminRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UsersPage from "./pages/UsersPage";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
