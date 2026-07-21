import { useState } from "react";
import { color, font } from "../theme";
import { useAdminCalendar, useSetDailyGameOverride } from "../hooks/useAdminCalendar";
import { useGames } from "../hooks/useGames";
import { CATEGORY_META, CATEGORIAS_CON_JUEGO } from "../lib/categories";
import { todayISO } from "../lib/daily";
import type { Categoria } from "../types/db";

const DAYS = 14;
const MS_PER_DAY = 86400000;

export function AdminCalendarPage() {
  const [categoria, setCategoria] = useState<Categoria>(CATEGORIAS_CON_JUEGO[0] ?? "cultura");
  const { data: rows, isLoading } = useAdminCalendar(DAYS);
  const { data: games } = useGames();
  const setOverride = useSetDailyGameOverride();
  const today = todayISO();

  const opciones = (games ?? []).filter((g) => g.categoria === categoria && g.estado === "prod");

  const dias = Array.from({ length: DAYS }, (_, i) => todayISO(Date.now() + i * MS_PER_DAY));

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        📅 Calendario
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Próximos {DAYS} días. Solo se puede sobrescribir el juego de días futuros — hoy y el pasado son intocables.
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {CATEGORIAS_CON_JUEGO.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            style={{
              padding: "6px 12px",
              border: `1px solid ${categoria === cat ? color.azul : color.linea}`,
              background: categoria === cat ? color.azulTinte : "transparent",
              fontFamily: font.body,
              fontWeight: 700,
              fontSize: 13,
              color: categoria === cat ? color.azul : color.tintaSuave,
              cursor: "pointer",
            }}
          >
            {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].nombre}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {dias.map((fecha) => {
          const row = rows?.find((r) => r.fecha === fecha && r.categoria === categoria);
          const isToday = fecha === today;
          const game = games?.find((g) => g.id === row?.game_id);
          return (
            <div
              key={fecha}
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr 220px",
                gap: 12,
                alignItems: "center",
                padding: "8px 10px",
                background: isToday ? color.azulTinte : color.card,
                border: `1px solid ${color.linea}`,
                fontFamily: font.body,
                fontSize: 13,
                color: color.tinta,
              }}
            >
              <span style={{ fontFamily: font.mono, fontWeight: isToday ? 700 : 400 }}>
                {isToday ? "HOY" : fecha}
              </span>
              <span>
                {row ? (
                  <>
                    {game?.emoji ?? "🎮"} {game?.nombre ?? row.game_id}
                    {row.override && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontFamily: font.mono,
                          fontSize: 10,
                          color: color.rojo,
                          border: `1px solid ${color.rojo}`,
                          padding: "1px 6px",
                        }}
                      >
                        override
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: color.muted }}>sin sembrar</span>
                )}
              </span>
              <span>
                {!isToday && row && (
                  <select
                    value={row.game_id}
                    onChange={(e) =>
                      setOverride.mutate({ fecha, categoria, gameId: e.target.value, seed: row.seed })
                    }
                    style={{
                      width: "100%",
                      fontFamily: font.body,
                      fontSize: 12,
                      padding: "5px 6px",
                      border: `1px solid ${color.linea}`,
                    }}
                  >
                    {opciones.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.emoji} {g.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
