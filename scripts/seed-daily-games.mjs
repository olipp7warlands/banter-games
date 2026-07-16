// Siembra docs/DB_SCHEMA.sql::daily_games para los juegos migrados en M1 (trivia, flechas).
// Uso: node scripts/seed-daily-games.mjs [--days=30]
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

const daysArg = process.argv.find((a) => a.startsWith("--days="));
const DAYS = daysArg ? parseInt(daysArg.split("=")[1], 10) : 30;

// Rotación M1: solo las 2 categorías con juego real. DAY = floor(ms/86400000) en UTC (seed global, sin ambigüedad de zona horaria).
const GAME_BY_CATEGORY = { cultura: "trivia", ingenio: "flechas" };
const CATEGORY_OFFSET = { cultura: 0, ingenio: 1 };

function dayIndexUTC(date) {
  return Math.floor(date.getTime() / 86400000);
}

function seedFor(dayIndex, categoria) {
  // Determinista por (día, categoría): cultura e ingenio nunca comparten seed el mismo día.
  return dayIndex * 2 + CATEGORY_OFFSET[categoria];
}

function isoDate(dayIndex) {
  return new Date(dayIndex * 86400000).toISOString().slice(0, 10);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startDay = dayIndexUTC(new Date());
  const rows = [];
  for (let i = 0; i < DAYS; i++) {
    const dayIndex = startDay + i;
    const fecha = isoDate(dayIndex);
    for (const categoria of Object.keys(GAME_BY_CATEGORY)) {
      rows.push({
        fecha,
        categoria,
        game_id: GAME_BY_CATEGORY[categoria],
        seed: seedFor(dayIndex, categoria),
      });
    }
  }

  const { error } = await supabase.from("daily_games").upsert(rows, { onConflict: "fecha,categoria" });
  if (error) {
    console.error("Error sembrando daily_games:", error.message);
    process.exit(1);
  }
  console.log(`Sembrados ${rows.length} registros de daily_games (${DAYS} días, categorías: ${Object.keys(GAME_BY_CATEGORY).join(", ")}).`);
}

main();
