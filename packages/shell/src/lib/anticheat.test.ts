import { describe, expect, it } from "vitest";
import { computeOutliers } from "./anticheat";
import type { Play } from "../types/db";

let seq = 0;
function play(overrides: Partial<Play>): Play {
  seq += 1;
  return {
    id: `play-${seq}`,
    user_id: "user-1",
    group_id: "group-1",
    game_id: "trivia",
    fecha: "2026-07-21",
    attempt: 1,
    score: 100,
    secs: 30,
    bonus: 0,
    sabotaged: false,
    valid: true,
    created_at: "2026-07-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeOutliers", () => {
  it("sin partidas, no hay flags", () => {
    expect(computeOutliers([])).toEqual([]);
  });

  it("marca secs < 3 independientemente del score", () => {
    const p = play({ secs: 2, score: 10 });
    const flags = computeOutliers([p]);
    expect(flags).toEqual([{ play: p, reason: "secs-too-low" }]);
  });

  it("no marca secs null (juegos endless sin par)", () => {
    const p = play({ secs: null, score: 10 });
    expect(computeOutliers([p])).toEqual([]);
  });

  it("marca varios scores muy por encima del resto de su juego", () => {
    const baseline = Array.from({ length: 200 }, () => play({ score: 10, secs: 30 }));
    const outlierA = play({ score: 500, secs: 30 });
    const outlierB = play({ score: 600, secs: 30 });
    const outlierC = play({ score: 700, secs: 30 });
    const flags = computeOutliers([...baseline, outlierA, outlierB, outlierC]);

    const flaggedIds = flags.map((f) => f.play.id);
    expect(flaggedIds).toEqual(expect.arrayContaining([outlierA.id, outlierB.id, outlierC.id]));
    expect(flags).toHaveLength(3);
    expect(flags.every((f) => f.reason === "score-p99")).toBe(true);
  });

  it("no marca nada si el juego tiene pocas partidas (muestra insuficiente para percentil)", () => {
    // n=20 < MIN_SAMPLE_FOR_PERCENTILE: con tan pocas partidas, "top 1%" sería literalmente
    // "el máximo", así que el mejor jugador legítimo siempre quedaría marcado sin motivo.
    const plays = Array.from({ length: 20 }, (_, i) => play({ score: 100 + i, secs: 30 }));
    expect(computeOutliers(plays)).toEqual([]);
  });

  it("detecta un único pico extremo incluso cuando cae en el índice más alto de la muestra", () => {
    // Caso que expone el bug de auto-referencia: sin el ajuste de -1 en el índice, un pico
    // solitario en una muestra de 51 caería justo en su propia posición de p99 y nunca se
    // marcaría a sí mismo como "por encima" de ese umbral.
    const baseline = Array.from({ length: 50 }, () => play({ score: 50, secs: 30 }));
    const spike = play({ score: 9999, secs: 30 });
    const flags = computeOutliers([...baseline, spike]);
    expect(flags).toEqual([{ play: spike, reason: "score-p99" }]);
  });

  it("los p99 se calculan por separado para cada juego", () => {
    const trivia = Array.from({ length: 50 }, () => play({ game_id: "trivia", score: 50, secs: 30 }));
    const acertijosSpike = play({ game_id: "acertijos", score: 9999, secs: 30 });
    const acertijosBaseline = Array.from({ length: 50 }, () => play({ game_id: "acertijos", score: 50, secs: 30 }));
    const flags = computeOutliers([...trivia, ...acertijosBaseline, acertijosSpike]);
    expect(flags).toEqual([{ play: acertijosSpike, reason: "score-p99" }]);
  });
});
