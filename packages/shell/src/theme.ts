// Tokens de diseño Bauhaus — ÚNICA fuente de verdad (CLAUDE.md). Nombres semánticos,
// no legacy del prototipo (nada de "teal"/"coral"/"basil"): azul, rojo, amarillo, tinta.
// Radius 0 en botones y superficies; sin verde, nunca.

export const color = {
  fondo: "#F2EFE9",
  fondoAlt: "#F7F4EE",
  pagina: "#191713",

  card: "#FFFFFF",
  cardCalido: "#FBF9F4",

  superficie: "rgba(26,26,26,0.06)",
  superficieFuerte: "rgba(26,26,26,0.11)",
  linea: "rgba(26,26,26,0.12)",

  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  muted: "#8C8880",

  rojo: "#E63946",
  rojoOscuro: "#B02733",
  azul: "#1D5DEC",
  azulOscuro: "#1445B0",
  amarillo: "#F4C20D",
  amarilloOscuro: "#8A6D00",
} as const;

export const font = {
  display: "'Jost', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'DM Mono', monospace",
} as const;

export const radius = 0;

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const easing = "cubic-bezier(0.22, 1, 0.36, 1)"; // spring suave estándar
