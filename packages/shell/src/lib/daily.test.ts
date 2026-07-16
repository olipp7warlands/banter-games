import { describe, expect, it } from "vitest";
import { computeBonus, formatCountdownLabel, getDayIndex, msUntilNextUTCMidnight, todayISO } from "./daily";

describe("computeBonus", () => {
  it("da puntos cuando el tiempo queda por debajo del par", () => {
    expect(computeBonus(50, 30)).toBe(40); // (50-30)*2
  });

  it("nunca es negativo cuando el tiempo supera el par", () => {
    expect(computeBonus(50, 90)).toBe(0);
  });

  it("es cero cuando el tiempo iguala el par", () => {
    expect(computeBonus(50, 50)).toBe(0);
  });

  it("es cero si falta par o secs (juegos sin crono, p.ej. Bloques)", () => {
    expect(computeBonus(null, 30)).toBe(0);
    expect(computeBonus(50, null)).toBe(0);
  });
});

describe("getDayIndex", () => {
  it("da el mismo índice para dos instantes del mismo día UTC", () => {
    const a = Date.UTC(2026, 6, 16, 0, 0, 1);
    const b = Date.UTC(2026, 6, 16, 23, 59, 59);
    expect(getDayIndex(a)).toBe(getDayIndex(b));
  });

  it("incrementa al cruzar medianoche UTC", () => {
    const before = Date.UTC(2026, 6, 16, 23, 59, 59);
    const after = Date.UTC(2026, 6, 17, 0, 0, 0);
    expect(getDayIndex(after)).toBe(getDayIndex(before) + 1);
  });
});

describe("todayISO", () => {
  it("devuelve la fecha en formato YYYY-MM-DD", () => {
    expect(todayISO(Date.UTC(2026, 6, 16, 12, 0, 0))).toBe("2026-07-16");
  });
});

describe("msUntilNextUTCMidnight", () => {
  it("a medianoche UTC exacta, faltan 24h completas hasta la siguiente", () => {
    const midnight = Date.UTC(2026, 6, 16, 0, 0, 0);
    expect(msUntilNextUTCMidnight(midnight)).toBe(24 * 60 * 60 * 1000);
  });

  it("un segundo antes de medianoche, falta 1 segundo", () => {
    const almostMidnight = Date.UTC(2026, 6, 16, 23, 59, 59);
    expect(msUntilNextUTCMidnight(almostMidnight)).toBe(1000);
  });

  it("a mediodía UTC, faltan 12h", () => {
    const noon = Date.UTC(2026, 6, 16, 12, 0, 0);
    expect(msUntilNextUTCMidnight(noon)).toBe(12 * 60 * 60 * 1000);
  });
});

describe("formatCountdownLabel", () => {
  it("formatea horas y minutos con el sufijo esperado", () => {
    expect(formatCountdownLabel(3 * 60 * 60 * 1000 + 20 * 60 * 1000)).toBe("⏳ 3h 20min hasta las 00:00 UTC");
  });

  it("redondea hacia abajo al minuto y nunca es negativo", () => {
    expect(formatCountdownLabel(59_000)).toBe("⏳ 0h 0min hasta las 00:00 UTC");
    expect(formatCountdownLabel(-500)).toBe("⏳ 0h 0min hasta las 00:00 UTC");
  });
});
