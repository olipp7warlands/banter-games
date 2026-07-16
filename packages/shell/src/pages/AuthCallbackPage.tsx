import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { useProfile } from "../hooks/useProfile";
import { color, font } from "../theme";

export function AuthCallbackPage() {
  const { session, loading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    if (profileLoading) return;
    navigate(profile ? "/groups" : "/onboarding", { replace: true });
  }, [sessionLoading, session, profileLoading, profile, navigate]);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: color.fondo }}>
      <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Entrando…</div>
    </div>
  );
}
