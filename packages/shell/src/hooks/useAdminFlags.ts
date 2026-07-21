import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { FlagRow, ReportRow } from "../types/db";

// Feature flags — lectura pública (RLS "leer flags" en docs/DB_SCHEMA_M5.sql), escritura
// solo admin.
export function useFlags() {
  return useQuery({
    queryKey: ["flags"],
    queryFn: async (): Promise<FlagRow[]> => {
      const { data, error } = await supabase.from("flags").select("*").order("key");
      if (error) throw new Error(error.message);
      return data as FlagRow[];
    },
  });
}

export function useUpdateFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, patch }: { key: string; patch: Partial<Pick<FlagRow, "estado" | "pct">> }) => {
      const { error } = await supabase.from("flags").update(patch).eq("key", key);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flags"] }),
  });
}

// Reportes de moderación — solo admin lee/actualiza (RLS en docs/DB_SCHEMA_M5.sql).
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<ReportRow[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as ReportRow[];
    },
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").update({ estado: "resuelto" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}
