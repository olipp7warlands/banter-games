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

// M1 solo migró 2 juegos (Trivia, Flechas); el resto de categorías se muestran
// deshabilitadas ("Pronto") en vez de ocultarse, porque el enum de 6 categorías ya está fijado en el schema.
export const CATEGORIES_DISPONIBLES_M1: Categoria[] = ["cultura", "ingenio"];

export const GAME_META: Record<string, { nombre: string; par: number | null; emoji: string }> = {
  trivia: { nombre: "Trivia", par: 50, emoji: "🧠" },
  flechas: { nombre: "Flechas", par: 90, emoji: "➡️" },
};
