import { describe, expect, it } from "vitest";
import { computeBonus } from "./bonus";

describe("computeBonus", () => {
  it("devuelve 0 si no hay par", () => {
    expect(computeBonus(null, 30)).toBe(0);
    expect(computeBonus(undefined, 30)).toBe(0);
  });

  it("devuelve 0 si no hay secs", () => {
    expect(computeBonus(50, null)).toBe(0);
    expect(computeBonus(50, undefined)).toBe(0);
  });

  it("devuelve max(0, par-secs)*2", () => {
    expect(computeBonus(50, 30)).toBe(40);
    expect(computeBonus(50, 50)).toBe(0);
  });

  it("nunca es negativo si secs supera el par", () => {
    expect(computeBonus(50, 80)).toBe(0);
  });
});
