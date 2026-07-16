import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Categoria, DailyGame } from "../types/db";
import { todayISO } from "../lib/daily";

// El cliente jamás calcula el reto: solo lee lo que el servidor (seed script / futura API) ya sembró.
export function useDailyGame(categoria: Categoria | undefined) {
  const fecha = todayISO();
  return useQuery({
    queryKey: ["dailyGame", categoria, fecha],
    queryFn: async (): Promise<DailyGame | null> => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("categoria", categoria as string)
        .eq("fecha", fecha)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!categoria,
  });
}
