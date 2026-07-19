// Reto diario: DAY = floor(ahora/86400000) en UTC — el seed es global ("misma seed para todos"),
// y con miembros en distintas zonas horarias, UTC es lo único no ambiguo.

const MS_PER_DAY = 86400000;

export function getDayIndex(now: Date | number = Date.now()): number {
  const ms = typeof now === "number" ? now : now.getTime();
  return Math.floor(ms / MS_PER_DAY);
}

export function todayISO(now: Date | number = Date.now()): string {
  const ms = typeof now === "number" ? now : now.getTime();
  return new Date(Math.floor(ms / MS_PER_DAY) * MS_PER_DAY).toISOString().slice(0, 10);
}

// Milisegundos hasta la próxima medianoche UTC (cuándo cambia el reto del día).
export function msUntilNextUTCMidnight(now: number | Date = Date.now()): number {
  const ms = typeof now === "number" ? now : now.getTime();
  const nextMidnight = (getDayIndex(ms) + 1) * MS_PER_DAY;
  return nextMidnight - ms;
}

// "⏳ 3h 20min hasta las 00:00 UTC" — para el chip de cuenta atrás del reto de hoy.
export function formatCountdownLabel(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `⏳ ${h}h ${m}min hasta las 00:00 UTC`;
}
