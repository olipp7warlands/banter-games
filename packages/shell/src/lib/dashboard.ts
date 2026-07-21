import type { Play } from "../types/db";

export interface DashboardStats {
  jugadoresUnicos: number;
  partidasPorDia: Array<{ fecha: string; count: number }>;
  topJuegos: Array<{ gameId: string; count: number }>;
}

// Agrega la ventana de plays recibida (todas, válidas o no — es una métrica de actividad,
// no de ranking) en JS, sin RPC/vista nueva: jugadores únicos, partidas por día (orden
// ascendente de fecha) y los 5 juegos más jugados. Función pura, testeada sin Supabase.
export function computeDashboardStats(plays: Play[]): DashboardStats {
  const jugadoresUnicos = new Set(plays.map((p) => p.user_id)).size;

  const porDia = new Map<string, number>();
  plays.forEach((p) => porDia.set(p.fecha, (porDia.get(p.fecha) ?? 0) + 1));
  const partidasPorDia = [...porDia.entries()]
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const porJuego = new Map<string, number>();
  plays.forEach((p) => porJuego.set(p.game_id, (porJuego.get(p.game_id) ?? 0) + 1));
  const topJuegos = [...porJuego.entries()]
    .map(([gameId, count]) => ({ gameId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { jugadoresUnicos, partidasPorDia, topJuegos };
}
