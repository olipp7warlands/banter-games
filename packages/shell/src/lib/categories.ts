import { color } from "../theme";
import type { Categoria } from "../types/db";

// Traducido de CATS en prototype/banter.jsx (nombre + emoji por categoría).
export const CATEGORY_META: Record<Categoria, { nombre: string; emoji: string }> = {
  palabras: { nombre: "Palabras", emoji: "🔤" },
  ingenio: { nombre: "Ingenio", emoji: "🧩" },
  cultura: { nombre: "Cultura", emoji: "🧠" },
  rapidez: { nombre: "Rapidez", emoji: "⚡" },
  clasicos: { nombre: "Clásicos", emoji: "🎲" },
  arena: { nombre: "Arena", emoji: "🌐" },
};

// Split diagonal 50/50 de dos primarios por categoría — mismo mapeo que CATS.g1/g2 en
// prototype/banter.jsx, pero los colores salen de theme.ts (única fuente de tokens).
export const CATEGORY_SPLIT: Record<Categoria, [string, string]> = {
  palabras: [color.azul, color.amarillo],
  ingenio: [color.rojo, color.azul],
  cultura: [color.azul, color.rojo],
  rapidez: [color.amarillo, color.rojo],
  clasicos: [color.rojo, color.amarillo],
  arena: [color.tinta, color.azul],
};

// Categorías con al menos un juego migrado al SDK v1 (M4, por lotes — ver CLAUDE.md); el
// resto se muestran deshabilitadas ("Pronto") en vez de ocultarse, porque el enum de 6
// categorías ya está fijado en el schema. "arena" queda pendiente (su único juego sigue en
// estado "qa" en manifest.json).
export const CATEGORIAS_CON_JUEGO: Categoria[] = ["cultura", "ingenio", "palabras", "rapidez", "clasicos"];

// GAME_META (nombre/par/emoji por juego) vivía aquí como objeto estático — M5 lo sustituye
// por la tabla `games` en DB (docs/DB_SCHEMA_M5.sql), leída vía hooks/useGames.ts, para que
// el backoffice pueda editar el `par` de un juego y que el shell lo refleje sin redeploy.
