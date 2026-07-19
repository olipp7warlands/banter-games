import { Router, type Response } from "express";
import { requireUser, type AuthedRequest } from "../auth";
import { creditWallet, findGiftClaim, getWalletBalance, insertGiftClaim } from "../db";
import { rollGiftReward } from "../lib/economy";
import { todayISO } from "../lib/today";

export const giftRouter = Router();

giftRouter.post("/gift/claim", requireUser, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const fecha = todayISO();

  try {
    if (await findGiftClaim(userId, fecha)) {
      res.status(409).json({ error: "Ya reclamaste el regalo de hoy" });
      return;
    }

    const reward = rollGiftReward();
    await creditWallet(userId, reward.amount, "regalo");
    await insertGiftClaim(userId, fecha, "coins", reward.amount);
    const walletBalance = await getWalletBalance(userId);

    res.json({ rewardAmount: reward.amount, walletBalance });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
