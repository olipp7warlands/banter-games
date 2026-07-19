import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { callApi } from "../lib/apiClient";
import type { Play } from "../types/db";
import { todayISO } from "../lib/daily";
import { useSession } from "./useSession";

const MAX_ATTEMPTS = 2; // 2 intentos/día por grupo (CLAUDE.md)

export interface SubmitPlayResult {
  play: Play;
  breakdown: { rawScore: number; bonus: number; secs: number | null; total: number };
  coinsAwarded: number;
  walletBalance: number;
}

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
    mutationFn: async ({ score, secs }: { score: number; secs: number | null }): Promise<SubmitPlayResult> => {
      if (!userId || !groupId || !gameId || !session) throw new Error("Falta grupo, juego o sesión");
      // La API (packages/api) es la única que escribe en `plays`: valida cupo de intentos,
      // membership y calcula el bonus server-side (docs/DB_SCHEMA_M3.sql cierra el insert
      // directo del cliente).
      return callApi<SubmitPlayResult>("/play", {
        body: { groupId, gameId, score, secs },
        accessToken: session.access_token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTodayPlays", groupId, userId, fecha] });
      queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
    },
  });
}
