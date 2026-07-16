import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Categoria, Group, GroupLookupResult } from "../types/db";
import { useSession } from "./useSession";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I, para leer en voz alta sin lios

function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

export function useMyGroups() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["myGroups", userId],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase
        .from("group_members")
        .select("group:groups(*)")
        .eq("user_id", userId as string);
      if (error) throw error;
      return (data ?? []).map((row) => row.group as unknown as Group).filter(Boolean);
    },
    enabled: !!userId,
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async (): Promise<Group | null> => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", groupId as string).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async ({ nombre, categoria }: { nombre: string; categoria: Categoria }) => {
      if (!userId) throw new Error("Sin sesión");
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ nombre, categoria, invite_code: generateInviteCode(), created_by: userId })
        .select()
        .single();
      if (groupError) throw groupError;
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: userId, role: "admin" });
      if (memberError) throw memberError;
      return group as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups", userId] });
    },
  });
}

export function useGroupLookup(code: string | undefined) {
  return useQuery({
    queryKey: ["groupLookup", code],
    queryFn: async (): Promise<GroupLookupResult | null> => {
      const { data, error } = await supabase.rpc("group_lookup_by_code", { code });
      if (error) throw error;
      return (data?.[0] as GroupLookupResult) ?? null;
    },
    enabled: !!code,
  });
}

export function useJoinGroup() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      if (!userId) throw new Error("Sin sesión");
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: userId, role: "member" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups", userId] });
    },
  });
}
