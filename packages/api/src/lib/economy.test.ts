import { describe, expect, it } from "vitest";
import { rollGiftReward } from "./economy";

describe("rollGiftReward", () => {
  it("devuelve 30 monedas para el tramo bajo del sorteo (peso 3 de 4)", () => {
    expect(rollGiftReward(0).amount).toBe(30);
    expect(rollGiftReward(0.5).amount).toBe(30);
    expect(rollGiftReward(0.74).amount).toBe(30);
  });

  it("devuelve 60 monedas para el tramo alto del sorteo (peso 1 de 4)", () => {
    expect(rollGiftReward(0.76).amount).toBe(60);
    expect(rollGiftReward(0.99).amount).toBe(60);
  });
});
