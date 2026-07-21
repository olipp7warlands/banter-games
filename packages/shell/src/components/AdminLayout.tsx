import { NavLink, Outlet } from "react-router-dom";
import { color, font } from "../theme";

// Layout propio del backoffice (no el AppShell de 520px del resto del shell — las tablas
// de Catálogo/Anti-cheat necesitan más ancho). Sidebar + contenido, spec visual de
// prototype/banter-backoffice.html adaptada a Bauhaus (radius 0, tokens de theme.ts).
const SECTIONS: Array<{ to: string; label: string; emoji: string }> = [
  { to: "dashboard", label: "Dashboard", emoji: "📊" },
  { to: "calendar", label: "Calendario", emoji: "📅" },
  { to: "catalog", label: "Catálogo", emoji: "🎮" },
  { to: "anti-cheat", label: "Anti-cheat", emoji: "🕵️" },
  { to: "flags", label: "Flags", emoji: "🚩" },
  { to: "search", label: "Búsqueda", emoji: "👥" },
];

export function AdminLayout() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", background: color.fondo }}>
      <nav
        style={{
          width: 210,
          flex: "0 0 auto",
          borderRight: `1px solid ${color.linea}`,
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: color.tinta, padding: "0 10px 16px" }}>
          Backoffice
        </div>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 10px",
              fontFamily: font.body,
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              color: isActive ? color.tinta : color.tintaSuave,
              background: isActive ? color.superficie : "transparent",
              textDecoration: "none",
            })}
          >
            <span>{s.emoji}</span>
            {s.label}
          </NavLink>
        ))}
      </nav>
      <main style={{ flex: 1, maxWidth: 1000, padding: 28, boxSizing: "border-box", overflowX: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
