import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "./dashboard";
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

describe("computeDashboardStats", () => {
  it("sin partidas, todo en cero/vacío", () => {
    expect(computeDashboardStats([])).toEqual({ jugadoresUnicos: 0, partidasPorDia: [], topJuegos: [] });
  });

  it("cuenta jugadores únicos (no partidas)", () => {
    const plays = [
      play({ user_id: "a" }),
      play({ user_id: "a" }),
      play({ user_id: "b" }),
    ];
    expect(computeDashboardStats(plays).jugadoresUnicos).toBe(2);
  });

  it("agrupa partidas por día en orden ascendente de fecha", () => {
    const plays = [
      play({ fecha: "2026-07-22" }),
      play({ fecha: "2026-07-20" }),
      play({ fecha: "2026-07-20" }),
      play({ fecha: "2026-07-21" }),
    ];
    expect(computeDashboardStats(plays).partidasPorDia).toEqual([
      { fecha: "2026-07-20", count: 2 },
      { fecha: "2026-07-21", count: 1 },
      { fecha: "2026-07-22", count: 1 },
    ]);
  });

  it("top juegos ordenados desc y limitados a 5", () => {
    const plays = [
      ...Array.from({ length: 3 }, () => play({ game_id: "a" })),
      ...Array.from({ length: 5 }, () => play({ game_id: "b" })),
      play({ game_id: "c" }),
      play({ game_id: "d" }),
      play({ game_id: "e" }),
      play({ game_id: "f" }),
      play({ game_id: "g" }),
    ];
    const top = computeDashboardStats(plays).topJuegos;
    expect(top).toHaveLength(5);
    expect(top[0]).toEqual({ gameId: "b", count: 5 });
    expect(top[1]).toEqual({ gameId: "a", count: 3 });
  });

  it("cuenta todas las partidas (válidas e inválidas) — métrica de actividad, no de ranking", () => {
    const plays = [play({ valid: true }), play({ valid: false })];
    expect(computeDashboardStats(plays).partidasPorDia).toEqual([{ fecha: "2026-07-21", count: 2 }]);
  });
});
