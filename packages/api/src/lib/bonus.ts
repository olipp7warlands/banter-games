// Misma fórmula que packages/shell/src/lib/daily.ts::computeBonus — se duplica a propósito
// (2 líneas, sin paquete compartido entre shell/api todavía) para que la API sea la fuente
// de verdad server-validada; el shell la usa solo para mostrar el desglose en pantalla.
export function computeBonus(par: number | null | undefined, secs: number | null | undefined): number {
  if (par == null || secs == null) return 0;
  return Math.max(0, par - secs) * 2;
}
