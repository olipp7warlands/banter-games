import { useEffect, useRef, useState } from "react";
import { color, font } from "../theme";

interface Props {
  gameId: string;
  seed: number;
  parSegundos: number | null;
  onGameOver: (result: { score: number; secs: number | null }) => void;
}

type Phase = "loading" | "playing";

// Lado shell del contrato SDK v1 (packages/games-sdk/sdk.js): envía INIT/START,
// escucha READY/GAME_OVER. En producción el postMessage debe fijar el origin real
// del iframe (mismo dominio, /games/*); en dev usamos "*" igual que hace el propio SDK.
export function GamePlayer({ gameId, seed, parSegundos, onGameOver }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || e.source !== win) return;
      const m = e.data || {};
      if (!m.banter) return;
      if (m.type === "READY") {
        win.postMessage({ banter: 1, v: 1, type: "START" }, "*");
        setPhase("playing");
      }
      if (m.type === "GAME_OVER") {
        const { score, stats } = m.payload || {};
        onGameOver({ score: score ?? 0, secs: stats?.secs ?? null });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onGameOver]);

  const handleLoad = () => {
    const win = iframeRef.current?.contentWindow;
    win?.postMessage(
      {
        banter: 1,
        v: 1,
        type: "INIT",
        payload: { seed, tema: "classic", dificultad: "media", parSegundos, idioma: "es" },
      },
      "*"
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {phase === "loading" && (
        <div style={{ padding: 40, textAlign: "center", fontFamily: font.body, color: color.tintaSuave }}>
          Cargando juego…
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`/games/${gameId}/index.html`}
        onLoad={handleLoad}
        title={gameId}
        style={{ width: "100%", height: 560, border: "none", display: phase === "loading" ? "none" : "block" }}
      />
    </div>
  );
}
