import { describe, expect, it } from "vitest";
import { mulberry32, genPlates, isBlocked, withScrewRemoved, markPlateGoneIfEmpty, dropPlate, PAL } from "./plates.mjs";

const BW = 330;
const BH = 300;

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("genPlates", () => {
  it("genera 5 placas (2+2+1) con 3 tornillos cada una", () => {
    const plates = genPlates(2026071601, BW, BH);
    expect(plates).toHaveLength(5);
    expect(plates.every((p) => p.screws.length === 3)).toBe(true);
  });

  it("los niveles z son 0,0,1,1,2 (mismo reparto [2,2,1] que el prototipo)", () => {
    const plates = genPlates(2026071601, BW, BH);
    expect(plates.map((p) => p.z)).toEqual([0, 0, 1, 1, 2]);
  });

  it("misma seed -> mismas placas dos veces", () => {
    expect(genPlates(2026071601, BW, BH)).toEqual(genPlates(2026071601, BW, BH));
  });

  it("seeds distintas -> placas distintas", () => {
    expect(genPlates(1, BW, BH)).not.toEqual(genPlates(2, BW, BH));
  });

  it("todas las placas caen dentro del tablero", () => {
    const plates = genPlates(777, BW, BH);
    plates.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(BW);
      expect(p.y + p.h).toBeLessThanOrEqual(BH);
    });
  });

  it("la paleta no incluye verde (regla Bauhaus 'sin verde')", () => {
    expect(PAL.every((c) => c !== "#7FB069")).toBe(true);
  });

  it("todos los colores de placa vienen de la paleta fijada", () => {
    const plates = genPlates(321, BW, BH);
    plates.forEach((p) => expect(PAL).toContain(p.col));
  });
});

describe("isBlocked", () => {
  it("bloquea un tornillo tapado por una placa de nivel superior", () => {
    const under = { id: 0, z: 0, x: 0, y: 0, w: 100, h: 100, gone: false };
    const over = { id: 1, z: 1, x: 0, y: 0, w: 100, h: 100, gone: false };
    const screw = { px: 50, py: 50 };
    expect(isBlocked([under, over], under, screw)).toBe(true);
  });

  it("no bloquea si la placa superior ya está gone", () => {
    const under = { id: 0, z: 0, x: 0, y: 0, w: 100, h: 100, gone: false };
    const over = { id: 1, z: 1, x: 0, y: 0, w: 100, h: 100, gone: true };
    const screw = { px: 50, py: 50 };
    expect(isBlocked([under, over], under, screw)).toBe(false);
  });

  it("no bloquea si la placa superior no cubre esa posición", () => {
    const under = { id: 0, z: 0, x: 0, y: 0, w: 100, h: 100, gone: false };
    const over = { id: 1, z: 1, x: 200, y: 200, w: 50, h: 50, gone: false };
    const screw = { px: 50, py: 50 };
    expect(isBlocked([under, over], under, screw)).toBe(false);
  });

  it("no bloquea contra una placa del mismo nivel o inferior", () => {
    const p = { id: 0, z: 1, x: 0, y: 0, w: 100, h: 100, gone: false };
    const sameLevel = { id: 1, z: 1, x: 0, y: 0, w: 100, h: 100, gone: false };
    const screw = { px: 50, py: 50 };
    expect(isBlocked([p, sameLevel], p, screw)).toBe(false);
  });
});

describe("cascada de retirada de tornillos", () => {
  it("withScrewRemoved quita solo el tornillo indicado", () => {
    const plates = [{ id: 0, screws: [{ id: 0 }, { id: 1 }], gone: false }];
    const next = withScrewRemoved(plates, 0, 0);
    expect(next[0].screws.map((s) => s.id)).toEqual([1]);
  });

  it("markPlateGoneIfEmpty marca gone solo cuando no quedan tornillos", () => {
    const withScrews = [{ id: 0, screws: [{ id: 1 }], gone: false }];
    expect(markPlateGoneIfEmpty(withScrews, 0)[0].gone).toBe(false);

    const empty = [{ id: 0, screws: [], gone: false }];
    expect(markPlateGoneIfEmpty(empty, 0)[0].gone).toBe(true);
  });

  it("dropPlate retira la placa de la lista", () => {
    const plates = [{ id: 0 }, { id: 1 }];
    expect(dropPlate(plates, 0)).toEqual([{ id: 1 }]);
  });
});
