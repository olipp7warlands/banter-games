import type { Play } from "../types/db";

export interface OutlierFlag {
  play: Play;
  reason: "score-p99" | "secs-too-low";
}

// Mismo umbral que MIN_HUMAN_SECS en packages/api/src/lib/validation.ts — la API ya marca
// valid:false por debajo de esto al insertar la partida, pero el backoffice igual lo
// resurface aquí (junto con el resto) para que un admin tenga una cola única que revisar,
// incluida cualquier fila insertada antes de que ese gate existiera.
const MIN_HUMAN_SECS = 3;

// Con menos partidas que esto para un juego, "top 1%" no tiene sentido estadístico (con
// n=20, el 1% es literalmente "el máximo", así que el mejor jugador legítimo siempre
// quedaría marcado). Por debajo del mínimo, ese juego no aplica el check de score — solo
// secs<3 sigue aplicando siempre, independientemente del tamaño de muestra.
const MIN_SAMPLE_FOR_PERCENTILE = 30;

// Marca partidas sospechosas dentro de la ventana recibida: score por encima del p99 de su
// propio juego, o secs por debajo del mínimo humano. Heurística básica (M5) — anti-cheat
// estadístico completo (varianza de timing, validación de replays) es M8, ver CLAUDE.md.
export function computeOutliers(plays: Play[]): OutlierFlag[] {
  const scoresByGame = new Map<string, number[]>();
  plays.forEach((p) => {
    const list = scoresByGame.get(p.game_id) ?? [];
    list.push(p.score);
    scoresByGame.set(p.game_id, list);
  });

  const p99ByGame = new Map<string, number>();
  scoresByGame.forEach((scores, gameId) => {
    if (scores.length < MIN_SAMPLE_FOR_PERCENTILE) return;
    const sorted = [...scores].sort((a, b) => a - b);
    // -1 respecto al índice "natural": si no, un único valor muy por encima del resto
    // puede terminar siendo su propio p99 (cae justo en el último índice) y nunca lo
    // superaría a sí mismo — un pico real quedaría invisible en vez de marcado.
    const idx = Math.max(0, Math.floor(sorted.length * 0.99) - 1);
    const threshold = sorted[idx];
    if (threshold != null) p99ByGame.set(gameId, threshold);
  });

  const flags: OutlierFlag[] = [];
  plays.forEach((p) => {
    if (p.secs != null && p.secs < MIN_HUMAN_SECS) {
      flags.push({ play: p, reason: "secs-too-low" });
      return;
    }
    const p99 = p99ByGame.get(p.game_id);
    if (p99 != null && p.score > p99) {
      flags.push({ play: p, reason: "score-p99" });
    }
  });
  return flags;
}
