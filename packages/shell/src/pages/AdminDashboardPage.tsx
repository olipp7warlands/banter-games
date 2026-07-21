import { color, font } from "../theme";
import { useAdminPlays } from "../hooks/useAdminPlays";
import { useGames } from "../hooks/useGames";
import { computeDashboardStats } from "../lib/dashboard";

const WINDOW_DAYS = 7;

export function AdminDashboardPage() {
  const { data: plays, isLoading } = useAdminPlays(WINDOW_DAYS);
  const { data: games } = useGames();

  if (isLoading) {
    return <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando métricas…</div>;
  }

  const stats = computeDashboardStats(plays ?? []);
  const maxDia = Math.max(1, ...stats.partidasPorDia.map((d) => d.count));

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        📊 Dashboard
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Últimos {WINDOW_DAYS} días, agregado en el cliente sobre `plays` — sin vista/RPC nueva.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Metric label="Jugadores activos" value={stats.jugadoresUnicos} />
        <Metric label="Partidas totales" value={plays?.length ?? 0} />
        <Metric label="Media partidas/día" value={Math.round(((plays?.length ?? 0) / WINDOW_DAYS) * 10) / 10} />
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, marginBottom: 10 }}>
        Partidas por día
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 24 }}>
        {stats.partidasPorDia.map((d) => (
          <div key={d.fecha} style={{ flex: 1, textAlign: "center" }}>
            <div
              title={`${d.fecha}: ${d.count}`}
              style={{
                height: `${Math.max(4, (d.count / maxDia) * 90)}px`,
                background: color.azul,
              }}
            />
            <div style={{ fontFamily: font.mono, fontSize: 9, color: color.muted, marginTop: 4 }}>
              {d.fecha.slice(5)}
            </div>
          </div>
        ))}
        {stats.partidasPorDia.length === 0 && (
          <div style={{ fontFamily: font.body, color: color.tintaSuave, fontSize: 13 }}>Sin datos todavía.</div>
        )}
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, marginBottom: 10 }}>
        Top juegos
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stats.topJuegos.map((t) => {
          const game = games?.find((g) => g.id === t.gameId);
          return (
            <div
              key={t.gameId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: `1px solid ${color.linea}`,
                fontFamily: font.body,
                fontSize: 14,
                color: color.tinta,
              }}
            >
              <span>
                {game?.emoji ?? "🎮"} {game?.nombre ?? t.gameId}
              </span>
              <span style={{ fontFamily: font.mono, color: color.tintaSuave }}>{t.count} partidas</span>
            </div>
          );
        })}
        {stats.topJuegos.length === 0 && (
          <div style={{ fontFamily: font.body, color: color.tintaSuave, fontSize: 13 }}>Sin datos todavía.</div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: color.card, border: `1px solid ${color.linea}`, padding: 14 }}>
      <div style={{ fontFamily: font.mono, fontSize: 11, color: color.muted, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: font.mono, fontSize: 26, fontWeight: 500, color: color.tinta, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
