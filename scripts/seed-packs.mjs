// Siembra docs/DB_SCHEMA.sql::packs con los 3 packs temáticos de prototype/banter.jsx::THEMES
// (hero/pirate/space, 300 monedas, exclusivo_game coincide con manifest/manifest.json).
// "classic" no se siembra: precio 0, incluido por defecto (ausencia de fila en user_packs).
// Uso: node scripts/seed-packs.mjs
// Requiere scripts/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (nunca VITE_*, nunca al cliente).
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en scripts/.env (ver scripts/.env.example)");
  process.exit(1);
}

const PACKS = [
  { id: "hero", nombre: "Superhéroes", emoji: "🦸", precio: 300, exclusivo_game: "volar", activo: true },
  { id: "pirate", nombre: "Piratas", emoji: "🏴‍☠️", precio: 300, exclusivo_game: "cazatesoros", activo: true },
  { id: "space", nombre: "Espacio", emoji: "🚀", precio: 300, exclusivo_game: "asteroides", activo: true },
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await supabase.from("packs").upsert(PACKS, { onConflict: "id" });
  if (error) {
    console.error("Error sembrando packs:", error.message);
    process.exit(1);
  }
  console.log(`Sembrados ${PACKS.length} packs: ${PACKS.map((p) => p.id).join(", ")}.`);
}

main();
