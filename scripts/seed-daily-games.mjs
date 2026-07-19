// Siembra docs/DB_SCHEMA.sql::daily_games para los juegos ya migrados al SDK v1 (M4, por
// lotes — ver CLAUDE.md). Uso: node scripts/seed-daily-games.mjs [--days=30]
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

// Solo las categorías con juego real migrado (ver lib/categories.ts::CATEGORIAS_CON_JUEGO
// en el shell — mantener ambas listas en sync). DAY = floor(ms/86400000) en UTC (seed
// global, sin ambigüedad de zona horaria).
const GAME_BY_CATEGORY = { cultura: "trivia", ingenio: "flechas", palabras: "anagram", rapidez: "math", clasicos: "truefalse" };
const CATEGORIAS = Object.keys(GAME_BY_CATEGORY);
const CATEGORY_OFFSET = Object.fromEntries(CATEGORIAS.map((cat, i) => [cat, i]));

function dayIndexUTC(date) {
  return Math.floor(date.getTime() / 86400000);
}

function seedFor(dayIndex, categoria) {
  // Determinista por (día, categoría): ninguna categoría comparte seed el mismo día.
  return dayIndex * CATEGORIAS.length + CATEGORY_OFFSET[categoria];
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

  // ignoreDuplicates: true = INSERT ... ON CONFLICT (fecha,categoria) DO NOTHING. A
  // propósito, no DO UPDATE: si una categoría ya tiene fila sembrada (p.ej. cultura/ingenio,
  // sembradas desde M1), volver a ejecutar este script con una fórmula de seed distinta no
  // debe cambiarles el reto ya asignado — solo rellena huecos (categorías nuevas, o días
  // sin sembrar todavía).
  const { error } = await supabase
    .from("daily_games")
    .upsert(rows, { onConflict: "fecha,categoria", ignoreDuplicates: true });
  if (error) {
    console.error("Error sembrando daily_games:", error.message);
    process.exit(1);
  }
  console.log(
    `Intentados ${rows.length} registros de daily_games (${DAYS} días, categorías: ${Object.keys(GAME_BY_CATEGORY).join(", ")}) — las filas ya existentes no se tocan.`
  );
}

main();
