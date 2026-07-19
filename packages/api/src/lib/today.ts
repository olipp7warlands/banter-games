const MS_PER_DAY = 86400000;

// Misma fórmula que packages/shell/src/lib/daily.ts::todayISO — DAY = floor(ms/86400000)
// en UTC, fecha global sin ambigüedad de zona horaria entre miembros de un grupo.
export function todayISO(now: number = Date.now()): string {
  return new Date(Math.floor(now / MS_PER_DAY) * MS_PER_DAY).toISOString().slice(0, 10);
}
