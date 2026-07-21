import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Play } from "../types/db";
import { todayISO } from "../lib/daily";

const MS_PER_DAY = 86400000;

// Requiere la policy "admins leen todas las plays" (docs/DB_SCHEMA_M5.sql) — sin ser admin,
// RLS solo dejaría ver las plays de los grupos propios. Se usa tanto en Dashboard (ventana
// corta) como en Anti-cheat (ventana más larga para tener muestra suficiente por juego).
export function useAdminPlays(days: number) {
  const desde = todayISO(Date.now() - days * MS_PER_DAY);
  return useQuery({
    queryKey: ["adminPlays", days],
    queryFn: async (): Promise<Play[]> => {
      const { data, error } = await supabase.from("plays").select("*").gte("fecha", desde);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// Requiere la policy "admins invalidan plays" (docs/DB_SCHEMA_M5.sql).
export function useInvalidatePlay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playId: string) => {
      const { error } = await supabase.from("plays").update({ valid: false }).eq("id", playId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPlays"] }),
  });
}
