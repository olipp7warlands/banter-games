import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findGiftClaim = vi.fn();
const insertGiftClaim = vi.fn();
const creditWallet = vi.fn();
const getWalletBalance = vi.fn();

vi.mock("../db", () => ({
  findGiftClaim: (...args: unknown[]) => findGiftClaim(...args),
  insertGiftClaim: (...args: unknown[]) => insertGiftClaim(...args),
  creditWallet: (...args: unknown[]) => creditWallet(...args),
  getWalletBalance: (...args: unknown[]) => getWalletBalance(...args),
}));

vi.mock("../auth", () => ({
  requireUser: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId: string }).userId = "user-1";
    next();
  },
}));

import { giftRouter } from "./gift";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(giftRouter);
  return app;
}

describe("POST /gift/claim", () => {
  beforeEach(() => {
    findGiftClaim.mockReset();
    insertGiftClaim.mockReset().mockResolvedValue(undefined);
    creditWallet.mockReset().mockResolvedValue(undefined);
    getWalletBalance.mockReset().mockResolvedValue(30);
  });

  it("rechaza si ya se reclamó hoy (409, idempotencia)", async () => {
    findGiftClaim.mockResolvedValue(true);
    const res = await request(buildApp()).post("/gift/claim").send({});
    expect(res.status).toBe(409);
    expect(creditWallet).not.toHaveBeenCalled();
  });

  it("otorga monedas y registra el reclamo la primera vez del día", async () => {
    findGiftClaim.mockResolvedValue(false);
    const res = await request(buildApp()).post("/gift/claim").send({});
    expect(res.status).toBe(200);
    expect([30, 60]).toContain(res.body.rewardAmount);
    expect(creditWallet).toHaveBeenCalledWith("user-1", res.body.rewardAmount, "regalo");
    expect(insertGiftClaim).toHaveBeenCalledWith("user-1", expect.any(String), "coins", res.body.rewardAmount);
  });
});
