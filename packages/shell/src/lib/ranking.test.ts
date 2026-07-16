import { describe, expect, it } from "vitest";
import { buildRanking } from "./ranking";

const NOW = Date.UTC(2026, 6, 16, 10, 0, 0);
const MEMBERS = [
  { userId: "a", nombre: "Ana", avatar: "🦊" },
  { userId: "b", nombre: "Beto", avatar: "🐼" },
  { userId: "c", nombre: "Cris", avatar: "🐧" },
];

describe("buildRanking", () => {
  it("ordena por score descendente", () => {
    const plays = [
      { userId: "a", score: 90, secs: 30 },
      { userId: "b", score: 150, secs: 40 },
      { userId: "c", score: 60, secs: 20 },
    ];
    const ranking = buildRanking(MEMBERS, plays, [], NOW);
    expect(ranking.map((r) => r.userId)).toEqual(["b", "a", "c"]);
  });

  it("desempata por secs ascendente cuando el score es igual", () => {
    const plays = [
      { userId: "a", score: 100, secs: 40 },
      { userId: "b", score: 100, secs: 25 },
    ];
    const ranking = buildRanking(MEMBERS.slice(0, 2), plays, [], NOW);
    expect(ranking.map((r) => r.userId)).toEqual(["b", "a"]);
  });

  it("se queda con el mejor intento aunque el peor venga después en el array", () => {
    const plays = [
      { userId: "a", score: 40, secs: 10 },
      { userId: "a", score: 120, secs: 50 },
    ];
    const ranking = buildRanking(MEMBERS.slice(0, 1), plays, [], NOW);
    expect(ranking[0]?.bestScore).toBe(120);
  });

  it("los usuarios que no jugaron hoy van al final con bestScore null", () => {
    const plays = [{ userId: "a", score: 50, secs: 20 }];
    const ranking = buildRanking(MEMBERS, plays, [], NOW);
    expect(ranking.at(-1)?.userId).toBe("c");
    expect(ranking.at(-1)?.bestScore).toBeNull();
  });

  it("calcula la racha de cada usuario a partir de su historial", () => {
    const history = [
      { userId: "a", fecha: "2026-07-16" },
      { userId: "a", fecha: "2026-07-15" },
      { userId: "b", fecha: "2026-07-10" },
    ];
    const ranking = buildRanking(MEMBERS, [], history, NOW);
    const a = ranking.find((r) => r.userId === "a");
    const b = ranking.find((r) => r.userId === "b");
    expect(a?.streak).toBe(2);
    expect(b?.streak).toBe(0);
  });
});
