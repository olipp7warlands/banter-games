import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { callApi } from "../lib/apiClient";
import type { Pack } from "../types/db";
import { useSession } from "./useSession";

export interface PackWithOwnership extends Pack {
  owned: boolean;
}

// Catálogo (lectura pública de activos) + propiedad (lectura propia) combinados en el
// cliente vía RLS directo; solo la compra pasa por la API (POST /store/buy).
export function usePacks() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["packs", userId],
    queryFn: async (): Promise<PackWithOwnership[]> => {
      const [packsRes, ownedRes] = await Promise.all([
        supabase.from("packs").select("*").eq("activo", true),
        supabase.from("user_packs").select("pack_id").eq("user_id", userId as string),
      ]);
      if (packsRes.error) throw packsRes.error;
      if (ownedRes.error) throw ownedRes.error;
      const ownedIds = new Set((ownedRes.data ?? []).map((p) => p.pack_id as string));
      return (packsRes.data as Pack[]).map((pack) => ({ ...pack, owned: ownedIds.has(pack.id) }));
    },
    enabled: !!userId,
  });
}

export function useBuyPack() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async (packId: string): Promise<{ pack: Pack; walletBalance: number }> => {
      if (!session) throw new Error("Falta sesión");
      return callApi("/store/buy", { body: { packId }, accessToken: session.access_token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
    },
  });
}
