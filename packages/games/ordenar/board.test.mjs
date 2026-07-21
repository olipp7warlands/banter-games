import { describe, expect, it } from "vitest";
import { mulberry32, buildTubes, isSolved, moveBall, CAP } from "./board.mjs";

const COLORS = ["#E63946", "#1D5DEC", "#F4C20D"];

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("buildTubes", () => {
  it("crea colors.length + 2 tubos", () => {
    const tubes = buildTubes(COLORS, 2026071601);
    expect(tubes).toHaveLength(COLORS.length + 2);
  });

  it("los 2 últimos tubos empiezan vacíos, el resto llenos a CAP", () => {
    const tubes = buildTubes(COLORS, 2026071601);
    expect(tubes[tubes.length - 1]).toHaveLength(0);
    expect(tubes[tubes.length - 2]).toHaveLength(0);
    expect(tubes.slice(0, COLORS.length).every((t) => t.length === CAP)).toBe(true);
  });

  it("conserva CAP fichas de cada color en total (barajadas, no perdidas)", () => {
    const tubes = buildTubes(COLORS, 2026071601);
    const all = tubes.flat();
    COLORS.forEach((c) => {
      expect(all.filter((x) => x === c)).toHaveLength(CAP);
    });
  });

  it("misma seed -> mismo tablero dos veces", () => {
    expect(buildTubes(COLORS, 7)).toEqual(buildTubes(COLORS, 7));
  });

  it("seeds distintas -> tableros distintos", () => {
    expect(buildTubes(COLORS, 1)).not.toEqual(buildTubes(COLORS, 2));
  });

  it("el tablero recién barajado no empieza ya resuelto", () => {
    // Con 3 colores y seeds normales la probabilidad de que salga ya ordenado es
    // prácticamente nula; comprobamos con unas cuantas seeds que nunca ocurre.
    for (let s = 1; s <= 20; s++) {
      expect(isSolved(buildTubes(COLORS, s))).toBe(false);
    }
  });
});

describe("moveBall", () => {
  it("mueve la ficha superior a un tubo vacío", () => {
    const tubes = [["a", "a", "b"], [], []];
    const next = moveBall(tubes, 0, 1, 4);
    expect(next[0]).toEqual(["a", "a"]);
    expect(next[1]).toEqual(["b"]);
  });

  it("mueve toda la racha si cabe (no solo una ficha)", () => {
    const tubes = [["b", "a", "a"], ["a"], []];
    const next = moveBall(tubes, 0, 1, 4);
    expect(next[0]).toEqual(["b"]);
    expect(next[1]).toEqual(["a", "a", "a"]);
  });

  it("rechaza mover a un tubo con otro color arriba", () => {
    const tubes = [["a"], ["b"]];
    expect(moveBall(tubes, 0, 1, 4)).toBeNull();
  });

  it("rechaza mover desde un tubo vacío", () => {
    const tubes = [[], ["b"]];
    expect(moveBall(tubes, 0, 1, 4)).toBeNull();
  });

  it("rechaza mover a un tubo ya lleno", () => {
    const tubes = [["a"], ["b", "b", "b", "b"]];
    expect(moveBall(tubes, 0, 1, 4)).toBeNull();
  });

  it("no muta el tablero original", () => {
    const tubes = [["a", "a"], []];
    moveBall(tubes, 0, 1, 4);
    expect(tubes[0]).toEqual(["a", "a"]);
    expect(tubes[1]).toEqual([]);
  });
});

describe("isSolved", () => {
  it("detecta un tablero resuelto", () => {
    const tubes = [["a", "a"], ["b", "b"], [], []];
    expect(isSolved(tubes, 2)).toBe(true);
  });

  it("detecta un tablero sin resolver", () => {
    const tubes = [["a", "b"], ["b", "a"]];
    expect(isSolved(tubes)).toBe(false);
  });
});
