import { supabaseAdmin } from "./supabaseAdmin";

// Único punto de acceso al catálogo de juegos desde la API. Hasta M5 esto leía
// manifest/manifest.json en disco; ahora lee la tabla `games` (docs/DB_SCHEMA_M5.sql,
// sembrada desde ese mismo JSON) para que un cambio de `par` en el backoffice afecte a la
// próxima partida sin redeploy. Requiere que DB_SCHEMA_M5.sql ya esté aplicado en Supabase
// antes de desplegar esta versión — si no, la tabla no existe y todo `par` saldría null.
export async function getPar(gameId: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin.from("games").select("par").eq("id", gameId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.par ?? null;
}
