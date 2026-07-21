import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { DailyGame } from "../types/db";
import { todayISO } from "../lib/daily";

const MS_PER_DAY = 86400000;

export function useAdminCalendar(days: number) {
  const start = todayISO();
  const end = todayISO(Date.now() + (days - 1) * MS_PER_DAY);
  return useQuery({
    queryKey: ["adminCalendar", start, end],
    queryFn: async (): Promise<DailyGame[]> => {
      const { data, error } = await supabase.from("daily_games").select("*").gte("fecha", start).lte("fecha", end);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// Requiere la policy "admins editan dias futuros" (docs/DB_SCHEMA_M5.sql, fecha > hoy). El
// seed se mantiene igual (viene de la fila ya sembrada por scripts/seed-daily-games.mjs) —
// la fórmula del seed no depende de qué juego rote, solo de (día, categoría), así que
// cambiar el juego no debería cambiar el seed de ese día.
export function useSetDailyGameOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fecha,
      categoria,
      gameId,
      seed,
    }: {
      fecha: string;
      categoria: string;
      gameId: string;
      seed: number;
    }) => {
      const { error } = await supabase
        .from("daily_games")
        .upsert({ fecha, categoria, game_id: gameId, seed, override: true }, { onConflict: "fecha,categoria" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminCalendar"] }),
  });
}
