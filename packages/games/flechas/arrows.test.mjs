import { describe, expect, it } from "vitest";
import { mulberry32, genArrows } from "./arrows.mjs";

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
  });
});

describe("genArrows", () => {
  it("misma seed -> mismo tablero (reto diario reproducible)", () => {
    expect(genArrows(2026071601, 8, 10)).toEqual(genArrows(2026071601, 8, 10));
  });

  it("seeds distintas producen tableros distintos", () => {
    expect(genArrows(1, 8, 10)).not.toEqual(genArrows(2, 8, 10));
  });

  it("las celdas de cada flecha caen dentro del tablero y no se solapan entre flechas", () => {
    const arrows = genArrows(99, 8, 10);
    const seen = new Set();
    for (const arrow of arrows) {
      expect(arrow.cells.length).toBeGreaterThanOrEqual(3);
      for (const [r, c] of arrow.cells) {
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(8);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(8);
        const key = `${r},${c}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });
});
