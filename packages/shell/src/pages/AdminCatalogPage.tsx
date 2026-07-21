import { useState } from "react";
import { color, font } from "../theme";
import { useGames, useUpdateGame } from "../hooks/useGames";
import type { GameRow } from "../types/db";

const NEXT_ESTADO: Record<GameRow["estado"], GameRow["estado"]> = {
  prod: "qa",
  qa: "off",
  off: "prod",
};

const ESTADO_COLOR: Record<GameRow["estado"], string> = {
  prod: color.azul,
  qa: color.amarillo,
  off: color.muted,
};

export function AdminCatalogPage() {
  const { data: games, isLoading } = useGames();
  const updateGame = useUpdateGame();

  if (isLoading) {
    return <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando catálogo…</div>;
  }

  return (
    <div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 4 }}>
        🎮 Catálogo
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Estado y par de crono de cada juego. Los cambios afectan al siguiente reto sin redeploy.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr .9fr .6fr .6fr",
          gap: 8,
          fontFamily: font.mono,
          fontSize: 11,
          color: color.muted,
          textTransform: "uppercase",
          padding: "0 10px 8px",
          borderBottom: `1px solid ${color.linea}`,
        }}
      >
        <div>Juego</div>
        <div>Categoría</div>
        <div>Estado</div>
        <div>Par (s)</div>
      </div>

      {games?.map((game) => (
        <GameRowItem key={game.id} game={game} onUpdate={updateGame} />
      ))}
    </div>
  );
}

function GameRowItem({
  game,
  onUpdate,
}: {
  game: GameRow;
  onUpdate: ReturnType<typeof useUpdateGame>;
}) {
  const [parDraft, setParDraft] = useState<string>(game.par == null ? "" : String(game.par));

  const commitPar = () => {
    const trimmed = parDraft.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isFinite(next) || next < 0)) {
      setParDraft(game.par == null ? "" : String(game.par));
      return;
    }
    if (next !== game.par) onUpdate.mutate({ id: game.id, patch: { par: next } });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.8fr .9fr .6fr .6fr",
        gap: 8,
        alignItems: "center",
        padding: "10px",
        borderBottom: `1px solid ${color.linea}`,
        opacity: game.estado === "off" ? 0.5 : 1,
        fontFamily: font.body,
        fontSize: 14,
        color: color.tinta,
      }}
    >
      <div>
        {game.emoji} {game.nombre}
      </div>
      <div style={{ fontFamily: font.mono, fontSize: 12, color: color.tintaSuave }}>{game.categoria}</div>
      <div>
        <button
          onClick={() => onUpdate.mutate({ id: game.id, patch: { estado: NEXT_ESTADO[game.estado] } })}
          style={{
            padding: "4px 10px",
            border: "none",
            fontFamily: font.mono,
            fontWeight: 700,
            fontSize: 11,
            textTransform: "uppercase",
            color: "#fff",
            background: ESTADO_COLOR[game.estado],
            cursor: "pointer",
          }}
        >
          {game.estado}
        </button>
      </div>
      <div>
        <input
          value={parDraft}
          onChange={(e) => setParDraft(e.target.value)}
          onBlur={commitPar}
          placeholder="—"
          style={{
            width: 48,
            fontFamily: font.mono,
            fontSize: 13,
            border: `1px solid ${color.linea}`,
            padding: "4px 6px",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
