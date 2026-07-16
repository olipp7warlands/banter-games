import { computeStreak } from "./streak";

export interface RankingMember {
  userId: string;
  nombre: string;
  avatar: string;
}
export interface RankingPlay {
  userId: string;
  score: number;
  secs: number | null;
}
export interface RankingHistoryDate {
  userId: string;
  fecha: string;
}

export interface RankingEntry {
  userId: string;
  nombre: string;
  avatar: string;
  bestScore: number | null; // null = no jugó hoy
  bestSecs: number | null;
  streak: number;
}

// Pura y testeable sin Supabase: dado el estado ya consultado (miembros, plays de hoy,
// fechas jugadas para las rachas), calcula el ranking del día. No asume que `todayPlays`
// venga pre-ordenado por la query — recalcula el mejor intento por usuario explícitamente.
export function buildRanking(
  members: RankingMember[],
  todayPlays: RankingPlay[],
  historyDates: RankingHistoryDate[],
  now: number | Date = Date.now()
): RankingEntry[] {
  const bestByUser = new Map<string, { score: number; secs: number | null }>();
  for (const p of todayPlays) {
    const current = bestByUser.get(p.userId);
    const better =
      !current ||
      p.score > current.score ||
      (p.score === current.score && (p.secs ?? Infinity) < (current.secs ?? Infinity));
    if (better) bestByUser.set(p.userId, { score: p.score, secs: p.secs });
  }

  const datesByUser = new Map<string, string[]>();
  for (const h of historyDates) {
    const list = datesByUser.get(h.userId) ?? [];
    list.push(h.fecha);
    datesByUser.set(h.userId, list);
  }

  const entries: RankingEntry[] = members.map((m) => {
    const best = bestByUser.get(m.userId);
    return {
      userId: m.userId,
      nombre: m.nombre,
      avatar: m.avatar,
      bestScore: best?.score ?? null,
      bestSecs: best?.secs ?? null,
      streak: computeStreak(datesByUser.get(m.userId) ?? [], now),
    };
  });

  entries.sort((a, b) => {
    if (a.bestScore == null && b.bestScore == null) return 0;
    if (a.bestScore == null) return 1;
    if (b.bestScore == null) return -1;
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return (a.bestSecs ?? Infinity) - (b.bestSecs ?? Infinity);
  });

  return entries;
}
