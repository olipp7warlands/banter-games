import type { RankingEntry } from "../lib/ranking";
import { color, font, radius } from "../theme";

export function RankingList({ entries }: { entries: RankingEntry[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map((e, i) => (
        <div
          key={e.userId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            background: color.card,
            border: `1px solid ${color.linea}`,
            borderRadius: radius,
            padding: "9px 12px",
            opacity: e.bestScore == null ? 0.5 : 1,
          }}
        >
          <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, width: 20, color: color.tintaSuave }}>
            {i + 1}
          </span>
          <span style={{ fontSize: 22 }}>{e.avatar}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: color.tinta }}>{e.nombre}</div>
            <div style={{ fontFamily: font.body, fontSize: 12, color: color.muted }}>
              {e.bestScore != null ? `${e.bestScore} pts${e.bestSecs != null ? ` · ${e.bestSecs}s` : ""}` : "sin jugar hoy"}
            </div>
          </div>
          {e.streak > 0 && (
            <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 13, color: color.rojo }}>🔥{e.streak}</span>
          )}
        </div>
      ))}
    </div>
  );
}
