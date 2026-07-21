import { describe, expect, it } from "vitest";
import { mulberry32, buildRounds } from "./build.mjs";
import { ODD_PAIRS } from "./pairs.mjs";

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("buildRounds", () => {
  it("genera 5 rondas por defecto", () => {
    const rounds = buildRounds(ODD_PAIRS, 2026071601);
    expect(rounds).toHaveLength(5);
  });

  it("el tamaño de tablero progresa 3,3,4,4,5", () => {
    const rounds = buildRounds(ODD_PAIRS, 2026071601);
    expect(rounds.map((r) => r.cols)).toEqual([3, 3, 4, 4, 5]);
    expect(rounds.map((r) => r.n)).toEqual([9, 9, 16, 16, 25]);
  });

  it("misma seed -> mismas rondas dos veces", () => {
    const a = buildRounds(ODD_PAIRS, 2026071601);
    const b = buildRounds(ODD_PAIRS, 2026071601);
    expect(a).toEqual(b);
  });

  it("seeds distintas -> rondas distintas", () => {
    const a = buildRounds(ODD_PAIRS, 1);
    const b = buildRounds(ODD_PAIRS, 2);
    expect(a).not.toEqual(b);
  });

  it("oddIndex siempre cae dentro del tablero de esa ronda", () => {
    const rounds = buildRounds(ODD_PAIRS, 999);
    rounds.forEach((r) => {
      expect(r.oddIndex).toBeGreaterThanOrEqual(0);
      expect(r.oddIndex).toBeLessThan(r.n);
    });
  });

  it("common y odd siempre son un par válido del banco", () => {
    const rounds = buildRounds(ODD_PAIRS, 12345);
    rounds.forEach((r) => {
      const match = ODD_PAIRS.some(([c, o]) => c === r.common && o === r.odd);
      expect(match).toBe(true);
    });
  });
});
