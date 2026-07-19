import { describe, expect, it } from "vitest";
import { isScoreValid, isSecsValid, MIN_HUMAN_SECS } from "./validation";

describe("isScoreValid", () => {
  it("acepta enteros no negativos", () => {
    expect(isScoreValid(0)).toBe(true);
    expect(isScoreValid(1234)).toBe(true);
  });

  it("rechaza negativos, NaN e infinito", () => {
    expect(isScoreValid(-1)).toBe(false);
    expect(isScoreValid(NaN)).toBe(false);
    expect(isScoreValid(Infinity)).toBe(false);
  });
});

describe("isSecsValid", () => {
  it("acepta null (juegos sin crono)", () => {
    expect(isSecsValid(null)).toBe(true);
  });

  it("rechaza negativos", () => {
    expect(isSecsValid(-1)).toBe(false);
  });

  it("acepta no negativos, incluso por debajo de MIN_HUMAN_SECS", () => {
    // isSecsValid solo valida forma; el umbral humano lo aplica play.ts marcando valid:false.
    expect(isSecsValid(0)).toBe(true);
    expect(isSecsValid(MIN_HUMAN_SECS - 1)).toBe(true);
  });
});
