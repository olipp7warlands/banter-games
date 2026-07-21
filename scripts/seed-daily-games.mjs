// Siembra docs/DB_SCHEMA.sql::daily_games para los juegos ya migrados al SDK v1 (M4, por
// lotes — ver CLAUDE.md). Uso: node scripts/seed-daily-games.mjs [--days=30] [--resow-future]
// Requiere scripts/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (nunca VITE_*, nunca al cliente).
//
// --resow-future: cuando GAMES_BY_CATEGORY cambia (nuevo lote migrado, nueva rotación), los
// días ya sembrados con la fórmula vieja no se actualizan solos — el upsert de abajo es
// ON CONFLICT DO NOTHING a propósito. Sin este flag, los juegos nuevos no entrarían en
// rotación hasta que caduque la ventana de ~30 días ya sembrada. El flag borra y vuelve a
// sembrar SOLO fecha > hoy (nunca hoy, nunca el pasado) antes del upsert normal. Es seguro
// porque docs/DB_SCHEMA_RLS_M1.sql define `daily_games publico hasta hoy` — la política de
// SELECT es `using (fecha <= current_date)`, así que ningún cliente (solo este script, con
// SERVICE_ROLE_KEY, que bypassa RLS) ha podido leer ni jugar una fila con fecha futura
// todavía. Borrar y re-sembrar esas filas no cambia ningún reto que alguien ya haya visto.
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
const RESOW_FUTURE = process.argv.includes("--resow-future");

// Solo las categorías con juego real migrado (ver lib/categories.ts::CATEGORIAS_CON_JUEGO
// en el shell — mantener ambas listas en sync). DAY = floor(ms/86400000) en UTC (seed
// global, sin ambigüedad de zona horaria).
//
// Cada categoría lista TODOS sus juegos migrados (no solo uno): cuando una categoría tiene
// varios, el juego del día rota entre ellos de forma determinista (ver gameFor) en vez de
// fijar uno solo — necesario desde que "cultura" pasó a tener trivia Y acertijos (M4 Lote B).
const GAMES_BY_CATEGORY = {
  cultura: ["trivia", "acertijos"],
  ingenio: ["flechas", "oddone", "ordenar", "tornillos", "merge", "bloques"],
  palabras: ["anagram"],
  rapidez: ["math"],
  clasicos: ["truefalse", "memoria"],
};
const CATEGORIAS = Object.keys(GAMES_BY_CATEGORY);
const CATEGORY_OFFSET = Object.fromEntries(CATEGORIAS.map((cat, i) => [cat, i]));

function dayIndexUTC(date) {
  return Math.floor(date.getTime() / 86400000);
}

function seedFor(dayIndex, categoria) {
  // Determinista por (día, categoría): ninguna categoría comparte seed el mismo día.
  // Independiente de qué juego rote ese día dentro de la categoría (ver gameFor).
  return dayIndex * CATEGORIAS.length + CATEGORY_OFFSET[categoria];
}

// Alterna día a día entre los juegos de una categoría (dayIndex % length). Con un solo
// juego en la lista se comporta igual que el mapeo fijo anterior (sin regresión para
// ingenio/palabras/rapidez/clasicos mientras solo tengan un juego cada una).
function gameFor(dayIndex, categoria) {
  const juegos = GAMES_BY_CATEGORY[categoria];
  return juegos[dayIndex % juegos.length];
}

function isoDate(dayIndex) {
  return new Date(dayIndex * 86400000).toISOString().slice(0, 10);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startDay = dayIndexUTC(new Date());
  const today = isoDate(startDay);

  if (RESOW_FUTURE) {
    // gt (>), no gte: hoy queda intocable a propósito, igual que el pasado.
    const { error: delError, count } = await supabase
      .from("daily_games")
      .delete({ count: "exact" })
      .gt("fecha", today);
    if (delError) {
      console.error("Error borrando filas futuras (--resow-future):", delError.message);
      process.exit(1);
    }
    console.log(`--resow-future: borradas ${count ?? "?"} filas con fecha > ${today}.`);
  }

  const rows = [];
  for (let i = 0; i < DAYS; i++) {
    const dayIndex = startDay + i;
    const fecha = isoDate(dayIndex);
    for (const categoria of CATEGORIAS) {
      rows.push({
        fecha,
        categoria,
        game_id: gameFor(dayIndex, categoria),
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
    `Intentados ${rows.length} registros de daily_games (${DAYS} días, categorías: ${CATEGORIAS.join(", ")}) — las filas ya existentes no se tocan.`
  );
}

main();
