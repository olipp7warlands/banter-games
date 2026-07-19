import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "./useSession";

// Solo lectura (RLS propia, docs/DB_SCHEMA_M3.sql); las escrituras solo las hace la API
// vía credit_wallet(). Sin fila todavía (nunca ganó monedas) = 0.
export function useWallet() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["wallet", userId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("wallets")
        .select("monedas")
        .eq("user_id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return data?.monedas ?? 0;
    },
    enabled: !!userId,
  });
}
