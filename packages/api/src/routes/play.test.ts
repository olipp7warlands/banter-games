import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isGroupMember = vi.fn();
const countTodaysPlays = vi.fn();
const insertPlay = vi.fn();
const creditWallet = vi.fn();
const getWalletBalance = vi.fn();

vi.mock("../db", () => ({
  isGroupMember: (...args: unknown[]) => isGroupMember(...args),
  countTodaysPlays: (...args: unknown[]) => countTodaysPlays(...args),
  insertPlay: (...args: unknown[]) => insertPlay(...args),
  creditWallet: (...args: unknown[]) => creditWallet(...args),
  getWalletBalance: (...args: unknown[]) => getWalletBalance(...args),
}));

vi.mock("../manifest", () => ({
  getPar: (gameId: string) => (gameId === "trivia" ? 50 : null),
}));

vi.mock("../auth", () => ({
  requireUser: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId: string }).userId = "user-1";
    next();
  },
}));

import { playRouter } from "./play";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(playRouter);
  return app;
}

const basePlay = {
  id: "play-1",
  user_id: "user-1",
  group_id: "group-1",
  game_id: "trivia",
  fecha: "2026-07-17",
  attempt: 1,
  secs: 30,
  bonus: 40,
  valid: true,
  created_at: "2026-07-17T00:00:00.000Z",
};

describe("POST /play", () => {
  beforeEach(() => {
    isGroupMember.mockReset().mockResolvedValue(true);
    countTodaysPlays.mockReset().mockResolvedValue(0);
    insertPlay.mockReset().mockImplementation(async (row) => ({ ...basePlay, ...row, score: row.score }));
    creditWallet.mockReset().mockResolvedValue(undefined);
    getWalletBalance.mockReset().mockResolvedValue(10);
  });

  it("rechaza payload inválido (400)", async () => {
    const res = await request(buildApp()).post("/play").send({ groupId: "g1" });
    expect(res.status).toBe(400);
  });

  it("rechaza si no eres miembro del grupo (403)", async () => {
    isGroupMember.mockResolvedValue(false);
    const res = await request(buildApp())
      .post("/play")
      .send({ groupId: "g1", gameId: "trivia", score: 100, secs: 30 });
    expect(res.status).toBe(403);
  });

  it("rechaza si ya se agotaron los 2 intentos de hoy (409)", async () => {
    countTodaysPlays.mockResolvedValue(2);
    const res = await request(buildApp())
      .post("/play")
      .send({ groupId: "g1", gameId: "trivia", score: 100, secs: 30 });
    expect(res.status).toBe(409);
  });

  it("calcula bonus con el par del manifest y suma el score total", async () => {
    const res = await request(buildApp())
      .post("/play")
      .send({ groupId: "g1", gameId: "trivia", score: 100, secs: 30 });
    expect(res.status).toBe(200);
    // par(trivia)=50, secs=30 -> bonus = (50-30)*2 = 40
    expect(res.body.breakdown).toEqual({ rawScore: 100, bonus: 40, secs: 30, total: 140 });
    expect(insertPlay).toHaveBeenCalledWith(expect.objectContaining({ score: 140, bonus: 40, valid: true }));
    expect(creditWallet).toHaveBeenCalledWith("user-1", 10, "partida");
    expect(res.body.coinsAwarded).toBe(10);
  });

  it("marca valid:false y no otorga monedas si secs es sospechosamente bajo", async () => {
    const res = await request(buildApp())
      .post("/play")
      .send({ groupId: "g1", gameId: "trivia", score: 100, secs: 1 });
    expect(res.status).toBe(200);
    expect(insertPlay).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
    expect(creditWallet).not.toHaveBeenCalled();
    expect(res.body.coinsAwarded).toBe(0);
  });

  it("no aplica bonus si el juego no tiene par (secs=null)", async () => {
    const res = await request(buildApp())
      .post("/play")
      .send({ groupId: "g1", gameId: "bloques", score: 100, secs: null });
    expect(res.status).toBe(200);
    expect(res.body.breakdown).toEqual({ rawScore: 100, bonus: 0, secs: null, total: 100 });
  });
});
