import { Router, type Response } from "express";
import { requireUser, type AuthedRequest } from "../auth";
import { countTodaysPlays, creditWallet, getWalletBalance, insertPlay, isGroupMember } from "../db";
import { COINS_PER_PARTIDA } from "../lib/economy";
import { computeBonus } from "../lib/bonus";
import { todayISO } from "../lib/today";
import { isScoreValid, isSecsValid, MIN_HUMAN_SECS } from "../lib/validation";
import { getPar } from "../manifest";

const MAX_ATTEMPTS = 2;

export const playRouter = Router();

playRouter.post("/play", requireUser, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { groupId, gameId, score, secs } = req.body ?? {};

  if (
    typeof groupId !== "string" ||
    typeof gameId !== "string" ||
    typeof score !== "number" ||
    (secs !== null && secs !== undefined && typeof secs !== "number")
  ) {
    res.status(400).json({ error: "Payload inválido" });
    return;
  }
  const secsValue: number | null = secs ?? null;
  if (!isScoreValid(score) || !isSecsValid(secsValue)) {
    res.status(400).json({ error: "score/secs fuera de rango" });
    return;
  }

  try {
    if (!(await isGroupMember(groupId, userId))) {
      res.status(403).json({ error: "No perteneces a este grupo" });
      return;
    }

    const fecha = todayISO();
    const attempt = (await countTodaysPlays(groupId, userId, fecha)) + 1;
    if (attempt > MAX_ATTEMPTS) {
      res.status(409).json({ error: "Sin intentos restantes hoy" });
      return;
    }

    const par = getPar(gameId);
    const bonus = computeBonus(par, secsValue);
    const total = score + bonus;
    // Secs sospechosamente bajo: se guarda igual (no se quema el intento por un fallo de
    // reloj) pero valid:false, así que no cuenta para ranking/ligas. Anti-cheat estadístico
    // completo (score>p99, varianza) queda para M5, ver CLAUDE.md.
    const valid = secsValue === null || secsValue >= MIN_HUMAN_SECS;

    const play = await insertPlay({
      userId,
      groupId,
      gameId,
      fecha,
      attempt,
      score: total,
      secs: secsValue,
      bonus,
      valid,
    });

    let coinsAwarded = 0;
    if (valid) {
      coinsAwarded = COINS_PER_PARTIDA;
      await creditWallet(userId, coinsAwarded, "partida");
    }
    const walletBalance = await getWalletBalance(userId);

    res.json({
      play,
      breakdown: { rawScore: score, bonus, secs: secsValue, total },
      coinsAwarded,
      walletBalance,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
