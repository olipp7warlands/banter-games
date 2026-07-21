# Decisiones fijadas (histórico corto)
- **Nombre**: Banter ✅ (pendiente verificación legal; reservas: Rounds, Huddle, Gameday).
- **Diseño**: N · Bauhaus ✅ — todo el producto se adapta a él (ver CLAUDE.md tokens). Exploración completa en prototype/definitivos.html.
- **Público**: generalista 35-65; juegos de cabeza como núcleo.
- **Loop**: reto diario por grupo, misma seed, 2 intentos, mejor marca, crono ascendente con bonus contra par (+2/s).
- **Social**: chinchar (gratis) + Modo Picante opt-in con reglas de sabotaje justo + mesas Mundial solo-positivas.
- **Competición**: Ligas semanales entre grupos (top-5, 60% participación, brackets, roster lock, anti-cheat).
- **Economía**: monedas por jugar; packs 300 (objetivo 5-9 días); packs = contenido+skins+juego exclusivo.
- **Fábrica**: pipeline referencia→spec(IA)→arquetipo+config→QA→manifest. Clonar mecánicas, jamás arte/nombres.
- **Distribución**: PWA primero; stores tras validar; itch/Poki como embudo; SEO agéntico.
- **Gate innegociable**: prueba de 7 días con grupo real antes de escalar features.
- **Repo**: https://github.com/olipp7warlands/banter-games
- **Desviación pragmática — `truefalse` vive en "clasicos", no en "cultura"**: en
  `prototype/banter.jsx` (`CATS.cultura.games`), Verdadero o Falso está listado junto a
  Trivia y Acertijos dentro de "cultura". En el shell de producción (`lib/categories.ts`)
  se reasignó a "clasicos" durante M4 Lote A (2026-07-19) porque "clasicos" no tenía
  ningún juego migrado todavía y el enum de 6 categorías del schema (`docs/DB_SCHEMA.sql`)
  ya estaba fijado — mover un juego migrado era más simple que añadir una categoría nueva.
  No es un cambio de producto (el juego sigue siendo el mismo), solo de qué categoría lo
  aloja mientras se completa la migración por lotes (M4). Si en algún momento se decide
  alinear el shell 1:1 con el prototipo, revisar esta nota antes de mover `truefalse` de
  vuelta a "cultura".
