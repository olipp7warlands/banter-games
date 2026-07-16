import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { buildRanking, type RankingEntry } from "../lib/ranking";
import { todayISO } from "../lib/daily";

const STREAK_WINDOW_DAYS = 60; // TODO: ampliar o mover a SQL cuando existan rachas > 60 días

export function useGroupRanking(groupId: string | undefined) {
  const fecha = todayISO();
  return useQuery({
    queryKey: ["groupRanking", groupId, fecha],
    queryFn: async (): Promise<RankingEntry[]> => {
      const since = todayISO(Date.now() - STREAK_WINDOW_DAYS * 86400000);

      const [membersRes, todayRes, historyRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("user_id, profile:profiles(nombre,avatar)")
          .eq("group_id", groupId as string),
        supabase
          .from("plays")
          .select("user_id, score, secs")
          .eq("group_id", groupId as string)
          .eq("fecha", fecha)
          .eq("valid", true),
        // Racha por grupo, no global: un usuario activo en otro grupo no debe heredar aquí su racha.
        supabase
          .from("plays")
          .select("user_id, fecha")
          .eq("group_id", groupId as string)
          .eq("valid", true)
          .gte("fecha", since),
      ]);
      if (membersRes.error) throw membersRes.error;
      if (todayRes.error) throw todayRes.error;
      if (historyRes.error) throw historyRes.error;

      const members = (membersRes.data ?? []).map((m) => {
        const profile = m.profile as unknown as { nombre: string; avatar: string } | null;
        return {
          userId: m.user_id as string,
          nombre: profile?.nombre ?? "?",
          avatar: profile?.avatar ?? "⭐",
        };
      });
      const todayPlays = (todayRes.data ?? []).map((p) => ({
        userId: p.user_id as string,
        score: p.score as number,
        secs: p.secs as number | null,
      }));
      const historyDates = (historyRes.data ?? []).map((p) => ({
        userId: p.user_id as string,
        fecha: p.fecha as string,
      }));

      return buildRanking(members, todayPlays, historyDates, Date.now());
    },
    enabled: !!groupId,
  });
}
