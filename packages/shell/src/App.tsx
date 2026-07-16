import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useSession } from "./hooks/useSession";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { GroupsListPage } from "./pages/GroupsListPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { JoinGroupPage } from "./pages/JoinGroupPage";
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
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}
