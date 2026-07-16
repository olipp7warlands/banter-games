import type { RankingEntry } from "../lib/ranking";
import { color, font } from "../theme";

// Colores fijos de CLAUDE.md/prototipo: 1º amarillo, 2º azul, 3º rojo, alturas 92/68/52.
const PLACE_STYLE: Record<1 | 2 | 3, { bg: string; height: number; text: string }> = {
  1: { bg: color.amarillo, height: 92, text: color.tinta },
  2: { bg: color.azul, height: 68, text: "#fff" },
  3: { bg: color.rojo, height: 52, text: "#fff" },
};

export function Podium({ entries }: { entries: RankingEntry[] }) {
  const jugaronHoy = entries.filter((e) => e.bestScore != null);
  const [first, second, third] = jugaronHoy;
  if (!first) return null;

  const order: Array<[RankingEntry | undefined, 1 | 2 | 3]> = [
    [second, 2],
    [first, 1],
    [third, 3],
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, margin: "12px 0 18px" }}>
      {order.map(([entry, place]) => {
        const width = place === 1 ? 88 : 74;
        if (!entry) return <div key={`empty-${place}`} style={{ width }} />;
        const style = PLACE_STYLE[place];
        return (
          <div key={entry.userId} style={{ display: "flex", flexDirection: "column", alignItems: "center", width }}>
            <div
              style={{
                position: "relative",
                width: place === 1 ? 56 : 46,
                height: place === 1 ? 56 : 46,
                borderRadius: "50%",
                background: color.card,
                border: `1px solid ${color.linea}`,
                display: "grid",
                placeItems: "center",
                fontSize: place === 1 ? 27 : 22,
                marginBottom: 6,
              }}
            >
              {place === 1 && <span style={{ position: "absolute", top: -20, fontSize: 22 }}>👑</span>}
              {entry.avatar}
            </div>
            <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 12, color: color.tinta, lineHeight: 1.1 }}>
              {entry.nombre}
            </div>
            <div style={{ fontFamily: font.mono, fontSize: 11, color: color.tintaSuave, marginBottom: 6 }}>
              {entry.bestScore} pts
            </div>
            <div
              style={{
                width: "100%",
                height: style.height,
                background: style.bg,
                display: "flex",
                justifyContent: "center",
                paddingTop: 8,
                color: style.text,
                fontFamily: font.display,
                fontWeight: 800,
                fontSize: 26,
              }}
            >
              {place}
            </div>
          </div>
        );
      })}
    </div>
  );
}
