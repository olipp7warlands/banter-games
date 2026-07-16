import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Play } from "../types/db";
import { todayISO } from "../lib/daily";
import { useSession } from "./useSession";

const MAX_ATTEMPTS = 2; // 2 intentos/día por grupo (CLAUDE.md)

export function useMyTodayPlays(groupId: string | undefined) {
  const { session } = useSession();
  const userId = session?.user.id;
  const fecha = todayISO();
  return useQuery({
    queryKey: ["myTodayPlays", groupId, userId, fecha],
    queryFn: async (): Promise<Play[]> => {
      const { data, error } = await supabase
        .from("plays")
        .select("*")
        .eq("group_id", groupId as string)
        .eq("user_id", userId as string)
        .eq("fecha", fecha)
        .order("attempt", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!groupId && !!userId,
  });
}

export function attemptsRemaining(plays: Play[]): number {
  return Math.max(0, MAX_ATTEMPTS - plays.length);
}

export function bestScore(plays: Play[]): number | null {
  if (plays.length === 0) return null;
  return Math.max(...plays.map((p) => p.score));
}

export function useSubmitPlay(groupId: string | undefined, gameId: string | undefined) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const fecha = todayISO();
  return useMutation({
    mutationFn: async ({ score, secs }: { score: number; secs: number | null }) => {
      if (!userId || !groupId || !gameId) throw new Error("Falta grupo, juego o sesión");
      const { count, error: countError } = await supabase
        .from("plays")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .eq("fecha", fecha);
      if (countError) throw countError;
      const attempt = (count ?? 0) + 1;
      if (attempt > MAX_ATTEMPTS) throw new Error("Sin intentos restantes hoy");
      const { data, error } = await supabase
        .from("plays")
        .insert({ user_id: userId, group_id: groupId, game_id: gameId, fecha, attempt, score, secs })
        .select()
        .single();
      if (error) throw error;
      return data as Play;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTodayPlays", groupId, userId, fecha] });
    },
  });
}
