import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "./useSession";

// Llama a la MISMA función SQL (is_admin(), docs/DB_SCHEMA_M5.sql) que usan las RLS
// policies del backoffice — una sola fuente de verdad para "¿soy admin?", tanto en el
// cliente (para pintar o no /admin) como en la base de datos (para permitir o no escribir).
export function useIsAdmin() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["isAdmin", session?.user.id],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw new Error(error.message);
      return Boolean(data);
    },
    enabled: !!session,
  });
}
