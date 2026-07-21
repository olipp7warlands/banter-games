import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { GameRow } from "../types/db";

// Catálogo de juegos (docs/DB_SCHEMA_M5.sql) — lectura pública vía RLS, así que cualquier
// pantalla del shell puede usar este hook (no solo el backoffice) para saber nombre/emoji/
// par de un juego. Reemplaza el GAME_META estático que vivía en lib/categories.ts.
export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: async (): Promise<GameRow[]> => {
      const { data, error } = await supabase.from("games").select("*").order("categoria").order("id");
      if (error) throw new Error(error.message);
      return data as GameRow[];
    },
  });
}

// Solo tiene efecto si el usuario es admin — la RLS de `games` (docs/DB_SCHEMA_M5.sql)
// rechaza el update para cualquier otro, aunque el botón llegara a estar visible.
export function useUpdateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<GameRow, "estado" | "par">> }) => {
      const { error } = await supabase.from("games").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
  });
}
