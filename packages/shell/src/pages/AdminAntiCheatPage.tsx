import { color, font } from "../theme";
import { useAdminPlays, useInvalidatePlay } from "../hooks/useAdminPlays";
import { useGames } from "../hooks/useGames";
import { computeOutliers, type OutlierFlag } from "../lib/anticheat";

const REASON_LABEL: Record<OutlierFlag["reason"], string> = {
  "score-p99": "score > p99 del juego",
  "secs-too-low": "tiempo infrahumano (<3s)",
};

const WINDOW_DAYS = 30;

export function AdminAntiCheatPage() {
  const { data: plays, isLoading } = useAdminPlays(WINDOW_DAYS);
  const { data: games } = useGames();
  const invalidate = useInvalidatePlay();

  if (isLoading) {
    return <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando partidas…</div>;
  }

  const flags = computeOutliers(plays ?? []);

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        🕵️ Anti-cheat
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Heurística básica sobre los últimos {WINDOW_DAYS} días: score por encima del p99 de su juego, o tiempo
        por debajo de 3s. Reglas server-side + validación de replays son un milestone posterior.
      </div>

      {flags.length === 0 ? (
        <div style={{ fontFamily: font.body, color: color.tintaSuave, padding: "20px 0" }}>Cola limpia ✨</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flags.map(({ play, reason }) => {
            const game = games?.find((g) => g.id === play.game_id);
            return (
              <div
                key={play.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: `1px solid ${color.linea}`,
                  background: color.card,
                  opacity: play.valid ? 1 : 0.5,
                }}
              >
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    background: color.rojo,
                    padding: "3px 8px",
                  }}
                >
                  {REASON_LABEL[reason]}
                </span>
                <span style={{ fontFamily: font.body, fontWeight: 700, fontSize: 14, color: color.tinta }}>
                  {game?.emoji ?? "🎮"} {game?.nombre ?? play.game_id}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 13, color: color.tintaSuave }}>
                  {play.score} pts{play.secs != null ? ` · ${play.secs}s` : ""}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.muted }}>
                  usuario {play.user_id.slice(0, 8)} · {play.fecha}
                </span>
                <span style={{ flex: 1 }} />
                <button
                  onClick={() => invalidate.mutate(play.id)}
                  disabled={!play.valid || invalidate.isPending}
                  style={{
                    padding: "6px 12px",
                    border: `1px solid ${color.rojo}`,
                    background: "transparent",
                    color: color.rojo,
                    fontFamily: font.display,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: play.valid ? "pointer" : "default",
                    opacity: play.valid ? 1 : 0.4,
                  }}
                >
                  {play.valid ? "Invalidar" : "Ya invalidada"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
