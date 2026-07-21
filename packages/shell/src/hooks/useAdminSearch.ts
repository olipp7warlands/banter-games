import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Group, Profile } from "../types/db";

export interface GroupSearchResult extends Group {
  miembros: number;
}

// Requiere las policies "admins leen todos los grupos" / "...las membresías"
// (docs/DB_SCHEMA_M5.sql) — sin ser admin, RLS solo dejaría ver los grupos propios.
// `profiles` ya era de lectura pública desde RLS_M1, así que esa mitad no necesitó policy
// nueva.
export function useAdminSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["adminSearch", q],
    queryFn: async (): Promise<{ profiles: Profile[]; groups: GroupSearchResult[] }> => {
      const [profilesRes, groupsRes] = await Promise.all([
        supabase.from("profiles").select("*").ilike("nombre", `%${q}%`).limit(20),
        supabase.from("groups").select("*").or(`nombre.ilike.%${q}%,invite_code.ilike.%${q}%`).limit(20),
      ]);
      if (profilesRes.error) throw new Error(profilesRes.error.message);
      if (groupsRes.error) throw new Error(groupsRes.error.message);

      const groupIds = (groupsRes.data ?? []).map((g) => g.id);
      let counts = new Map<string, number>();
      if (groupIds.length > 0) {
        const membersRes = await supabase.from("group_members").select("group_id").in("group_id", groupIds);
        if (membersRes.error) throw new Error(membersRes.error.message);
        counts = (membersRes.data ?? []).reduce((acc, row) => {
          acc.set(row.group_id, (acc.get(row.group_id) ?? 0) + 1);
          return acc;
        }, new Map<string, number>());
      }

      return {
        profiles: (profilesRes.data ?? []) as Profile[],
        groups: (groupsRes.data as Group[]).map((g) => ({ ...g, miembros: counts.get(g.id) ?? 0 })),
      };
    },
    enabled: q.length >= 2,
  });
}
