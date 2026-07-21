import { describe, expect, it } from "vitest";
import { mulberry32, rand3, canPlace, hasSpot, anyMove, place, emptyGrid, PIECES, N } from "./engine.mjs";

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("rand3", () => {
  it("devuelve 3 piezas del set fijado", () => {
    const rnd = mulberry32(2026071601);
    const hand = rand3(rnd);
    expect(hand).toHaveLength(3);
    hand.forEach((p) => expect(PIECES).toContain(p));
  });

  it("misma seed -> misma primera mano", () => {
    expect(rand3(mulberry32(7))).toEqual(rand3(mulberry32(7)));
  });

  it("consumidas en cadena, la misma seed produce la misma secuencia de manos", () => {
    const rndA = mulberry32(99);
    const rndB = mulberry32(99);
    const seqA = [rand3(rndA), rand3(rndA), rand3(rndA)];
    const seqB = [rand3(rndB), rand3(rndB), rand3(rndB)];
    expect(seqA).toEqual(seqB);
  });
});

describe("canPlace / hasSpot", () => {
  it("una pieza cabe en un tablero vacío", () => {
    const grid = emptyGrid(8);
    expect(canPlace(grid, PIECES[0], 0, 0)).toBe(true);
  });

  it("no cabe fuera de los límites del tablero", () => {
    const grid = emptyGrid(4);
    expect(canPlace(grid, [[0, 0], [0, 1], [0, 2]], 0, 3, 4)).toBe(false);
  });

  it("no cabe sobre una celda ocupada", () => {
    const grid = emptyGrid(4);
    grid[0][1] = 1;
    expect(canPlace(grid, [[0, 0], [0, 1]], 0, 0, 4)).toBe(false);
  });

  it("hasSpot encuentra un hueco si existe alguno", () => {
    const grid = emptyGrid(4);
    expect(hasSpot(grid, PIECES[0], 4)).toBe(true);
  });

  it("hasSpot da false en un tablero completamente lleno", () => {
    const grid = Array.from({ length: 2 }, () => [1, 1]);
    expect(hasSpot(grid, PIECES[0], 2)).toBe(false);
  });
});

describe("anyMove", () => {
  it("true si alguna pieza de la mano cabe en algún sitio", () => {
    const grid = emptyGrid(8);
    expect(anyMove(grid, [PIECES[0], null, null])).toBe(true);
  });

  it("false si el tablero está lleno y no hay hueco para ninguna pieza de la mano", () => {
    const full = Array.from({ length: 8 }, () => Array(8).fill(1));
    expect(anyMove(full, [PIECES[0], PIECES[1], PIECES[2]])).toBe(false);
  });

  it("false si la mano está vacía (todo null)", () => {
    const grid = emptyGrid(8);
    expect(anyMove(grid, [null, null, null])).toBe(false);
  });
});

describe("place", () => {
  it("coloca la pieza y suma su tamaño sin limpiar nada", () => {
    const grid = emptyGrid(4);
    const { grid: g, gained, clearedRows, clearedCols } = place(grid, [[0, 0], [0, 1]], 0, 0, 4);
    expect(g[0]).toEqual([1, 1, 0, 0]);
    expect(gained).toBe(2);
    expect(clearedRows).toBe(0);
    expect(clearedCols).toBe(0);
  });

  it("limpia una fila completa y suma el bonus de 10", () => {
    const grid = emptyGrid(4);
    grid[0] = [1, 1, 1, 0];
    const { grid: g, gained, clearedRows } = place(grid, [[0, 0]], 0, 3, 4);
    expect(g[0]).toEqual([0, 0, 0, 0]);
    expect(gained).toBe(1 + 10);
    expect(clearedRows).toBe(1);
  });

  it("limpia fila y columna a la vez si ambas quedan completas", () => {
    const grid = emptyGrid(2);
    grid[0][1] = 1;
    grid[1][0] = 1;
    const { grid: g, gained, clearedRows, clearedCols } = place(grid, [[1, 1]], 0, 0, 2);
    expect(g).toEqual([[0, 0], [0, 0]]);
    expect(clearedRows).toBe(1);
    expect(clearedCols).toBe(1);
    expect(gained).toBe(1 + 20);
  });

  it("no muta el tablero original", () => {
    const grid = emptyGrid(4);
    place(grid, [[0, 0]], 0, 0, 4);
    expect(grid[0][0]).toBe(0);
  });
});
