import type { ReactNode } from "react";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { color, font } from "../theme";

// Mismo patrón que RequireAuth en App.tsx, pero comprobando is_admin() en vez de sesión.
// El texto "403" es literal a propósito (verificación headless por contenido del DOM).
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: color.fondo }}>
        <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Comprobando permisos…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: color.fondo,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 48, color: color.rojo }}>403</div>
          <div style={{ fontFamily: font.body, fontSize: 15, color: color.tintaSuave, marginTop: 8 }}>
            Acceso denegado — esta cuenta no es administradora.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
