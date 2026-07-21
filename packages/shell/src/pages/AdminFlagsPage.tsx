import { color, font } from "../theme";
import { useFlags, useUpdateFlag, useReports, useResolveReport } from "../hooks/useAdminFlags";
import type { FlagRow } from "../types/db";

// on -> ab -> off -> on, con el pct por defecto de cada destino (mismo criterio que
// prototype/banter-backoffice.html: ab arranca a 50%, off se queda en 0, on vuelve a 100).
const NEXT: Record<FlagRow["estado"], { estado: FlagRow["estado"]; pct: number }> = {
  on: { estado: "ab", pct: 50 },
  ab: { estado: "off", pct: 0 },
  off: { estado: "on", pct: 100 },
};

const ESTADO_LABEL: Record<FlagRow["estado"], string> = { on: "ON", ab: "A/B", off: "OFF" };
const ESTADO_COLOR: Record<FlagRow["estado"], string> = { on: color.azul, ab: color.amarillo, off: color.muted };

export function AdminFlagsPage() {
  const { data: flags, isLoading: flagsLoading } = useFlags();
  const updateFlag = useUpdateFlag();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const resolveReport = useResolveReport();

  const pendientes = reports?.filter((r) => r.estado !== "resuelto") ?? [];

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        🚩 Flags
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, margin: "18px 0 10px" }}>
        Feature flags
      </div>
      {flagsLoading && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {flags?.map((flag) => (
          <div
            key={flag.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              border: `1px solid ${color.linea}`,
              background: color.card,
            }}
          >
            <button
              onClick={() =>
                updateFlag.mutate({ key: flag.key, patch: { estado: NEXT[flag.estado].estado, pct: NEXT[flag.estado].pct } })
              }
              style={{
                padding: "4px 10px",
                border: "none",
                fontFamily: font.mono,
                fontWeight: 700,
                fontSize: 11,
                color: "#fff",
                background: ESTADO_COLOR[flag.estado],
                cursor: "pointer",
                minWidth: 44,
              }}
            >
              {ESTADO_LABEL[flag.estado]}
            </button>
            <span style={{ fontFamily: font.body, fontWeight: 700, fontSize: 14, color: color.tinta, minWidth: 160 }}>
              {flag.key}
            </span>
            {flag.estado !== "off" && (
              <>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={flag.pct}
                  onChange={(e) => updateFlag.mutate({ key: flag.key, patch: { pct: Number(e.target.value) } })}
                  style={{ flex: 1, maxWidth: 160 }}
                />
                <span style={{ fontFamily: font.mono, fontSize: 12, color: color.tintaSuave, minWidth: 32 }}>
                  {flag.pct}%
                </span>
              </>
            )}
            <span style={{ flex: 1 }} />
            {flag.nota && (
              <span style={{ fontFamily: font.body, fontSize: 12, color: color.muted }}>{flag.nota}</span>
            )}
          </div>
        ))}
        {!flagsLoading && flags?.length === 0 && (
          <div style={{ fontFamily: font.body, color: color.tintaSuave, fontSize: 13 }}>Sin flags todavía.</div>
        )}
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, margin: "28px 0 10px" }}>
        Reportes (moderación)
      </div>
      {reportsLoading && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>}
      {!reportsLoading && pendientes.length === 0 ? (
        <div style={{ fontFamily: font.body, color: color.tintaSuave, padding: "10px 0" }}>Sin reportes pendientes ✨</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendientes.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                border: `1px solid ${color.linea}`,
                background: color.card,
              }}
            >
              <span style={{ fontFamily: font.mono, fontSize: 11, color: color.tintaSuave }}>{r.tipo ?? "reporte"}</span>
              <span style={{ fontFamily: font.body, fontSize: 13, color: color.tinta, flex: 1 }}>
                {r.ref ? JSON.stringify(r.ref) : "—"}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: color.muted }}>
                {r.created_at.slice(0, 10)}
              </span>
              <button
                onClick={() => resolveReport.mutate(r.id)}
                disabled={resolveReport.isPending}
                style={{
                  padding: "6px 12px",
                  border: `1px solid ${color.linea}`,
                  background: color.superficie,
                  color: color.tinta,
                  fontFamily: font.display,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Resolver
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
