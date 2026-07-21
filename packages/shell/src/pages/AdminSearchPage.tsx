import { useState } from "react";
import { color, font } from "../theme";
import { useAdminSearch } from "../hooks/useAdminSearch";

export function AdminSearchPage() {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useAdminSearch(query);

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        👥 Búsqueda
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Solo lectura — usuarios por nombre, grupos por nombre o código de invitación.
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar…"
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "10px 12px",
          border: `1.5px solid ${color.linea}`,
          fontFamily: font.body,
          fontSize: 14,
          boxSizing: "border-box",
          marginBottom: 20,
        }}
      />

      {query.trim().length > 0 && query.trim().length < 2 && (
        <div style={{ fontFamily: font.body, fontSize: 13, color: color.muted }}>Escribe al menos 2 caracteres.</div>
      )}
      {isFetching && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Buscando…</div>}

      {data && (
        <>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, marginBottom: 8 }}>
            Usuarios ({data.profiles.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
            {data.profiles.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "8px 10px",
                  border: `1px solid ${color.linea}`,
                  fontFamily: font.body,
                  fontSize: 13,
                  color: color.tinta,
                }}
              >
                <span>{p.avatar}</span>
                <span style={{ fontWeight: 700 }}>{p.nombre}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.muted }}>{p.id.slice(0, 8)}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.tintaSuave }}>
                  desde {p.created_at.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: color.tinta, marginBottom: 8 }}>
            Grupos ({data.groups.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.groups.map((g) => (
              <div
                key={g.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "8px 10px",
                  border: `1px solid ${color.linea}`,
                  fontFamily: font.body,
                  fontSize: 13,
                  color: color.tinta,
                }}
              >
                <span style={{ fontWeight: 700 }}>{g.nombre}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.tintaSuave }}>{g.categoria}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.muted }}>{g.invite_code}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.tintaSuave }}>
                  {g.miembros} miembro{g.miembros === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
