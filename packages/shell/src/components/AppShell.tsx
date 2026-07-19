import type { ReactNode } from "react";
import { color } from "../theme";

const COLUMN_MAX_WIDTH = 520;
// Los motivos solo se muestran cuando hay hueco real de sobra junto a la columna (si no,
// en 390px se solaparían con el contenido); 560 deja un margen sobre los 520 de la columna.
const MOTIFS_MIN_VIEWPORT = 560;

// Patrón "columna de app": todo el contenido (login incluido) vive en una columna
// centrada de ancho fijo; en desktop el resto del viewport se rellena con el fondo +
// motivos ●■▲ muy sutiles para que se lea como intencionado y no como un móvil estirado.
// Sin rediseño multi-columna todavía — cada página sigue controlando su propio padding/
// layout interno, esto solo aporta el contenedor y el fondo.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: color.fondo, position: "relative", overflowX: "hidden" }}>
      <BackgroundMotifs />
      <div style={{ position: "relative", zIndex: 1, maxWidth: COLUMN_MAX_WIDTH, margin: "0 auto", minHeight: "100dvh" }}>
        {children}
      </div>
    </div>
  );
}

const MOTIFS: Array<{ glyph: string; top: string; left?: string; right?: string; size: number; colorKey: "azul" | "rojo" | "amarillo" }> = [
  { glyph: "●", top: "8%", left: "4%", size: 120, colorKey: "azul" },
  { glyph: "■", top: "62%", left: "3%", size: 90, colorKey: "rojo" },
  { glyph: "▲", top: "28%", right: "4%", size: 110, colorKey: "amarillo" },
  { glyph: "●", top: "78%", right: "6%", size: 70, colorKey: "rojo" },
];

function BackgroundMotifs() {
  return (
    <>
      <style>{`
        @media (max-width: ${MOTIFS_MIN_VIEWPORT}px) {
          .banter-bg-motifs { display: none; }
        }
      `}</style>
      <div
        className="banter-bg-motifs"
        aria-hidden
        style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
      >
        {MOTIFS.map((m, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: m.top,
              left: m.left,
              right: m.right,
              fontSize: m.size,
              lineHeight: 1,
              color: color[m.colorKey],
              opacity: 0.05,
            }}
          >
            {m.glyph}
          </span>
        ))}
      </div>
    </>
  );
}
