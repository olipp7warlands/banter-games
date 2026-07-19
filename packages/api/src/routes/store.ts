import { Router, type Response } from "express";
import { requireUser, type AuthedRequest } from "../auth";
import { creditWallet, findPack, getWalletBalance, hasUserPack, insertUserPack } from "../db";

export const storeRouter = Router();

storeRouter.post("/store/buy", requireUser, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { packId } = req.body ?? {};
  if (typeof packId !== "string") {
    res.status(400).json({ error: "Falta packId" });
    return;
  }

  try {
    const pack = await findPack(packId);
    if (!pack) {
      res.status(404).json({ error: "Pack no existe o no está activo" });
      return;
    }
    if (await hasUserPack(userId, packId)) {
      res.status(409).json({ error: "Ya tienes este pack" });
      return;
    }

    const precio = pack.precio ?? 0;
    const balance = await getWalletBalance(userId);
    if (balance < precio) {
      res.status(402).json({ error: "Monedas insuficientes" });
      return;
    }

    await creditWallet(userId, -precio, "compra_pack");
    await insertUserPack(userId, packId);
    const walletBalance = await getWalletBalance(userId);

    res.json({ pack, walletBalance });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
