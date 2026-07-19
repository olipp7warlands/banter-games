import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findPack = vi.fn();
const hasUserPack = vi.fn();
const getWalletBalance = vi.fn();
const creditWallet = vi.fn();
const insertUserPack = vi.fn();

vi.mock("../db", () => ({
  findPack: (...args: unknown[]) => findPack(...args),
  hasUserPack: (...args: unknown[]) => hasUserPack(...args),
  getWalletBalance: (...args: unknown[]) => getWalletBalance(...args),
  creditWallet: (...args: unknown[]) => creditWallet(...args),
  insertUserPack: (...args: unknown[]) => insertUserPack(...args),
}));

vi.mock("../auth", () => ({
  requireUser: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId: string }).userId = "user-1";
    next();
  },
}));

import { storeRouter } from "./store";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(storeRouter);
  return app;
}

const heroPack = { id: "hero", nombre: "Superhéroes", emoji: "🦸", precio: 300, exclusivo_game: "volar", activo: true };

describe("POST /store/buy", () => {
  beforeEach(() => {
    findPack.mockReset().mockResolvedValue(heroPack);
    hasUserPack.mockReset().mockResolvedValue(false);
    getWalletBalance.mockReset().mockResolvedValue(300);
    creditWallet.mockReset().mockResolvedValue(undefined);
    insertUserPack.mockReset().mockResolvedValue(undefined);
  });

  it("rechaza si el pack no existe o no está activo (404)", async () => {
    findPack.mockResolvedValue(null);
    const res = await request(buildApp()).post("/store/buy").send({ packId: "hero" });
    expect(res.status).toBe(404);
  });

  it("rechaza si ya se posee el pack (409)", async () => {
    hasUserPack.mockResolvedValue(true);
    const res = await request(buildApp()).post("/store/buy").send({ packId: "hero" });
    expect(res.status).toBe(409);
    expect(creditWallet).not.toHaveBeenCalled();
  });

  it("rechaza si no hay monedas suficientes (402)", async () => {
    getWalletBalance.mockResolvedValue(100);
    const res = await request(buildApp()).post("/store/buy").send({ packId: "hero" });
    expect(res.status).toBe(402);
    expect(creditWallet).not.toHaveBeenCalled();
  });

  it("cobra el precio y registra la compra si hay saldo suficiente", async () => {
    const res = await request(buildApp()).post("/store/buy").send({ packId: "hero" });
    expect(res.status).toBe(200);
    expect(creditWallet).toHaveBeenCalledWith("user-1", -300, "compra_pack");
    expect(insertUserPack).toHaveBeenCalledWith("user-1", "hero");
  });
});
