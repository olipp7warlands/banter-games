import { describe, expect, it } from "vitest";
import { mulberry32, emptyGrid, spawn, slideLine, move, isStuck } from "./engine.mjs";

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("spawn", () => {
  it("coloca exactamente una ficha (2 o 4) en una rejilla vacía", () => {
    const rnd = mulberry32(2026071601);
    const grid = spawn(emptyGrid(4), rnd, 4);
    const values = grid.flat().filter(Boolean);
    expect(values).toHaveLength(1);
    expect([2, 4]).toContain(values[0]);
  });

  it("no cambia la rejilla si no hay huecos", () => {
    const full = [[2, 2], [2, 2]];
    const rnd = mulberry32(1);
    expect(spawn(full, rnd, 2)).toEqual(full);
  });

  it("misma seed -> misma secuencia de spawns", () => {
    const rndA = mulberry32(7);
    const rndB = mulberry32(7);
    let gA = emptyGrid(4);
    let gB = emptyGrid(4);
    for (let i = 0; i < 5; i++) {
      gA = spawn(gA, rndA, 4);
      gB = spawn(gB, rndB, 4);
    }
    expect(gA).toEqual(gB);
  });
});

describe("slideLine", () => {
  it("desliza huecos fuera y fusiona un único par consecutivo", () => {
    const [out, gain] = slideLine([2, 2, 0, 4], 4);
    expect(out).toEqual([4, 4, 0, 0]);
    expect(gain).toBe(4);
  });

  it("no fusiona una ficha dos veces en la misma pasada", () => {
    const [out, gain] = slideLine([2, 2, 2, 2], 4);
    expect(out).toEqual([4, 4, 0, 0]);
    expect(gain).toBe(8);
  });

  it("línea sin huecos ni pares no cambia", () => {
    const [out, gain] = slideLine([2, 4, 2, 4], 4);
    expect(out).toEqual([2, 4, 2, 4]);
    expect(gain).toBe(0);
  });
});

describe("move", () => {
  it("mueve todo hacia la izquierda y fusiona", () => {
    const grid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { grid: g, gain, changed } = move(grid, "L", 4);
    expect(g[0]).toEqual([4, 0, 0, 0]);
    expect(gain).toBe(4);
    expect(changed).toBe(true);
  });

  it("changed=false si el movimiento no altera nada", () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { changed } = move(grid, "L", 4);
    expect(changed).toBe(false);
  });

  it("mover a la derecha empuja las fichas al otro extremo", () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { grid: g } = move(grid, "R", 4);
    expect(g[0]).toEqual([0, 0, 0, 2]);
  });
});

describe("isStuck", () => {
  it("detecta un tablero bloqueado (lleno, sin fusiones posibles)", () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isStuck(grid, 4)).toBe(true);
  });

  it("no está bloqueado si queda algún hueco", () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 0],
    ];
    expect(isStuck(grid, 4)).toBe(false);
  });

  it("no está bloqueado si hay una fusión posible aunque esté lleno", () => {
    const grid = [
      [2, 2, 4, 2],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isStuck(grid, 4)).toBe(false);
  });
});
