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

// Bonus del crono ascendente: max(0, par - segundos) * 2. Única fuente de verdad —
// los juegos reportan score/secs en crudo (ver GamePlayer.tsx), el shell calcula el bonus.
export function computeBonus(par: number | null | undefined, secs: number | null | undefined): number {
  if (par == null || secs == null) return 0;
  return Math.max(0, par - secs) * 2;
}
