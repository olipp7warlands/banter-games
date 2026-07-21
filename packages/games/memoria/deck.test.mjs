import { describe, expect, it } from "vitest";
import { mulberry32, buildDeck } from "./deck.mjs";

const POOL = ["🍎", "🍌", "🍇", "🍒", "🥝", "🍑"];

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("buildDeck", () => {
  it("duplica el pool (2 cartas por emoji)", () => {
    const deck = buildDeck(POOL, 2026071601);
    expect(deck).toHaveLength(POOL.length * 2);
    POOL.forEach((e) => {
      expect(deck.filter((c) => c.e === e)).toHaveLength(2);
    });
  });

  it("cada carta conserva un índice único (0..2n-1)", () => {
    const deck = buildDeck(POOL, 2026071601);
    const indices = deck.map((c) => c.i).sort((a, b) => a - b);
    expect(indices).toEqual(Array.from({ length: POOL.length * 2 }, (_, i) => i));
  });

  it("misma seed -> mismo reparto dos veces", () => {
    expect(buildDeck(POOL, 7)).toEqual(buildDeck(POOL, 7));
  });

  it("seeds distintas -> repartos distintos", () => {
    expect(buildDeck(POOL, 1)).not.toEqual(buildDeck(POOL, 2));
  });
});
