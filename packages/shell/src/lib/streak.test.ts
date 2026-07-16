import { describe, expect, it } from "vitest";
import { computeStreak } from "./streak";

const TODAY = Date.UTC(2026, 6, 16, 10, 0, 0); // 2026-07-16, media mañana UTC

describe("computeStreak", () => {
  it("es 0 sin partidas", () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  it("cuenta días consecutivos incluyendo hoy", () => {
    expect(computeStreak(["2026-07-14", "2026-07-15", "2026-07-16"], TODAY)).toBe(3);
  });

  it("sigue viva contando desde ayer si hoy todavía no se ha jugado", () => {
    expect(computeStreak(["2026-07-14", "2026-07-15"], TODAY)).toBe(2);
  });

  it("se rompe si falta un día completo, aunque se jugara antes y hoy", () => {
    // jugó hoy y hace 3 días, pero no ayer ni anteayer -> el hueco corta la racha en 1
    expect(computeStreak(["2026-07-13", "2026-07-16"], TODAY)).toBe(1);
  });

  it("no duplica el conteo si hay varias partidas el mismo día (2 intentos)", () => {
    expect(computeStreak(["2026-07-16", "2026-07-16", "2026-07-15"], TODAY)).toBe(2);
  });

  it("ignora fechas futuras fuera de la racha actual", () => {
    expect(computeStreak(["2026-07-20", "2026-07-16", "2026-07-15"], TODAY)).toBe(2);
  });
});
