import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useSession } from "./hooks/useSession";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { GroupsListPage } from "./pages/GroupsListPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { JoinGroupPage } from "./pages/JoinGroupPage";
import { StorePage } from "./pages/StorePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminCalendarPage } from "./pages/AdminCalendarPage";
import { AdminCatalogPage } from "./pages/AdminCatalogPage";
import { AdminAntiCheatPage } from "./pages/AdminAntiCheatPage";
import { AdminFlagsPage } from "./pages/AdminFlagsPage";
import { AdminSearchPage } from "./pages/AdminSearchPage";
import { RequireAdmin } from "./components/RequireAdmin";
import { AdminLayout } from "./components/AdminLayout";
import { color, font } from "./theme";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: color.fondo }}>
        <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/groups"
        element={
          <RequireAuth>
            <GroupsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <RequireAuth>
            <GroupDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/store"
        element={
          <RequireAuth>
            <StorePage />
          </RequireAuth>
        }
      />
      <Route
        path="/join"
        element={
          <RequireAuth>
            <JoinGroupPage />
          </RequireAuth>
        }
      />
      <Route
        path="/join/:code"
        element={
          <RequireAuth>
            <JoinGroupPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="anti-cheat" element={<AdminAntiCheatPage />} />
        <Route path="flags" element={<AdminFlagsPage />} />
        <Route path="search" element={<AdminSearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}
