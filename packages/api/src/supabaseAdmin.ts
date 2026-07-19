import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copia packages/api/.env.example a .env y rellénalas."
  );
}

// Único cliente service_role del proceso: bypassea RLS, nunca se expone al shell.
export const supabaseAdmin = createClient(url, serviceRoleKey);
