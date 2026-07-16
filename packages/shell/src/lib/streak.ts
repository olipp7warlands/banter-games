import { getDayIndex } from "./daily";

function dayIndexFromISO(dateISO: string): number {
  return getDayIndex(Date.parse(`${dateISO}T00:00:00Z`));
}

// Racha estilo Duolingo: días consecutivos con al menos una partida válida, contando
// hacia atrás desde hoy. Si hoy todavía no se ha jugado, la racha sigue "viva" contando
// desde ayer hasta que se pierda un día entero — así no parece "romperse" solo porque
// el grupo vive en zonas horarias distintas y a alguien aún no le ha llegado su momento
// de jugar hoy. Reutiliza getDayIndex (UTC) de daily.ts para no desincronizarse del
// límite de día que usa el resto de la app para "hoy".
export function computeStreak(playedDatesISO: string[], now: number | Date = Date.now()): number {
  const days = new Set(playedDatesISO.map(dayIndexFromISO));
  const today = getDayIndex(now);
  let cursor = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
