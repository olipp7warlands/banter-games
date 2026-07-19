// Tiempo mínimo humanamente plausible para una run con crono. No es el anti-cheat
// estadístico completo (score>p99, varianza 0) planeado para M5 — solo un suelo básico:
// por debajo de esto la partida se guarda igual (no se pierde el intento) pero con
// valid:false, así que no cuenta para ranking/ligas.
export const MIN_HUMAN_SECS = 3;

export function isScoreValid(score: number): boolean {
  return Number.isFinite(score) && score >= 0;
}

export function isSecsValid(secs: number | null): boolean {
  return secs === null || (Number.isFinite(secs) && secs >= 0);
}
