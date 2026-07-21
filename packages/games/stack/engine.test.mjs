import { describe, expect, it } from "vitest";
import { mulberry32, initialHue, axisOf, project, resolveDrop, nextSpeed, nextAmplitude, S0, TOL } from "./engine.mjs";

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("initialHue", () => {
  it("misma seed -> mismo hue0", () => {
    expect(initialHue(2026071601)).toBe(initialHue(2026071601));
  });

  it("cae dentro de 0..359", () => {
    for (const seed of [1, 2, 3, 999, 123456]) {
      const h = initialHue(seed);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });

  it("seeds distintas -> hues normalmente distintos", () => {
    expect(initialHue(1)).not.toBe(initialHue(2));
  });
});

describe("axisOf", () => {
  it("alterna X en niveles impares, Y en pares", () => {
    expect(axisOf(1)).toBe("x");
    expect(axisOf(2)).toBe("y");
    expect(axisOf(3)).toBe("x");
    expect(axisOf(4)).toBe("y");
  });
});

describe("project", () => {
  it("proyecta el origen del mundo sobre el centro de cámara", () => {
    expect(project(0, 0, 0, 170, 318)).toEqual([170, 318]);
  });

  it("la altura z desplaza hacia arriba en pantalla (screenY menor)", () => {
    const [, y0] = project(0, 0, 0, 170, 318);
    const [, y1] = project(0, 0, 50, 170, 318);
    expect(y1).toBeLessThan(y0);
  });
});

describe("resolveDrop", () => {
  const top = { x: -55, y: -55, w: 110, d: 110, hue: 200 };

  it("acierto perfecto (offset dentro de TOL): suma 25, sin fragmento", () => {
    const res = resolveDrop(top, 1, 3, 0);
    expect(res.over).toBe(false);
    expect(res.perfect).toBe(true);
    expect(res.points).toBe(25);
    expect(res.fragment).toBeNull();
    expect(res.comboCount).toBe(1);
  });

  it("fallo parcial (offset > TOL pero < dim): suma 10, genera fragmento y corta el bloque en el eje activo", () => {
    const offset = TOL + 20;
    const res = resolveDrop(top, 1, offset, 0); // nivel 1 -> eje X
    expect(res.over).toBe(false);
    expect(res.perfect).toBe(false);
    expect(res.points).toBe(10);
    expect(res.comboCount).toBe(0);
    expect(res.fragment).not.toBeNull();
    expect(res.block.w).toBeLessThan(top.w);
    expect(res.block.d).toBe(top.d); // eje Y intacto, solo se corta el eje activo (X)
  });

  it("fallo total (offset >= dim - 4): fin de partida, sin bloque ni fragmento", () => {
    const res = resolveDrop(top, 1, top.w, 0);
    expect(res.over).toBe(true);
    expect(res.block).toBeUndefined();
  });

  it("3 perfectos consecutivos hacen crecer el bloque (hasta S0)", () => {
    let combo = 2; // ya lleva 2, este sería el 3º
    const shrunk = { x: -20, y: -20, w: 40, d: 40, hue: 0 };
    const res = resolveDrop(shrunk, 1, 0, combo);
    expect(res.comboCount).toBe(3);
    expect(res.block.w).toBeGreaterThan(shrunk.w);
    expect(res.block.w).toBeLessThanOrEqual(S0);
  });

  it("un fallo resetea el combo a 0", () => {
    const res = resolveDrop(top, 1, TOL + 15, 5);
    expect(res.comboCount).toBe(0);
  });

  it("el eje Y se corta en niveles pares, dejando X intacto", () => {
    const offset = TOL + 20;
    const res = resolveDrop(top, 2, offset, 0); // nivel 2 -> eje Y
    expect(res.block.d).toBeLessThan(top.d);
    expect(res.block.w).toBe(top.w);
  });
});

describe("nextSpeed / nextAmplitude", () => {
  it("la velocidad sube 7 por drop, con tope 330", () => {
    expect(nextSpeed(120)).toBe(127);
    expect(nextSpeed(328)).toBe(330);
    expect(nextSpeed(400)).toBe(330);
  });

  it("la amplitud depende del tamaño del bloque en el eje del siguiente nivel", () => {
    const block = { w: 90, d: 60 };
    expect(nextAmplitude(block, 2)).toBe(60 + 70); // nivel 2 -> eje Y -> d
    expect(nextAmplitude(block, 3)).toBe(90 + 70); // nivel 3 -> eje X -> w
  });
});
