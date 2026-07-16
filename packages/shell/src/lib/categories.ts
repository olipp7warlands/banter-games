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

// M1 solo migró 2 juegos (Trivia, Flechas); el resto de categorías se muestran
// deshabilitadas ("Pronto") en vez de ocultarse, porque el enum de 6 categorías ya está fijado en el schema.
export const CATEGORIES_DISPONIBLES_M1: Categoria[] = ["cultura", "ingenio"];

export const GAME_META: Record<string, { nombre: string; par: number | null }> = {
  trivia: { nombre: "Trivia", par: 50 },
  flechas: { nombre: "Flechas", par: 90 },
};
