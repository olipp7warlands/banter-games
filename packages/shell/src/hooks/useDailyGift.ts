import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { callApi } from "../lib/apiClient";
import { todayISO } from "../lib/daily";
import { useSession } from "./useSession";

// "¿Ya reclamé el regalo hoy?" — lectura directa (RLS propia); el reclamo real (sorteo +
// abono de monedas) solo lo hace la API, es la única forma de que sea idempotente de verdad.
export function useDailyGiftStatus() {
  const { session } = useSession();
  const userId = session?.user.id;
  const fecha = todayISO();
  return useQuery({
    queryKey: ["dailyGiftStatus", userId, fecha],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("gift_claims")
        .select("user_id")
        .eq("user_id", userId as string)
        .eq("fecha", fecha)
        .maybeSingle();
      if (error) throw error;
      return data != null;
    },
    enabled: !!userId,
  });
}

export function useClaimGift() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const fecha = todayISO();
  return useMutation({
    mutationFn: async (): Promise<{ rewardAmount: number; walletBalance: number }> => {
      if (!session) throw new Error("Falta sesión");
      return callApi("/gift/claim", { body: {}, accessToken: session.access_token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyGiftStatus", userId, fecha] });
      queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
    },
  });
}
