# CLAUDE.md — Contexto del proyecto Banter

## Qué es Banter
App social de **minijuegos diarios con tu círculo** (familia, amigos, compañeros). Cada grupo tiene una categoría; cada día sale UN reto (mismo juego + misma seed para todos) con 2 intentos, cronómetro ascendente y ranking. El motor social es el **pique amistoso** ("chinchar"). Público objetivo: generalista con foco en 35-65 (juegos "de cabeza" age-fair como núcleo; reflejos solo en Rapidez/Arena).

## Estado del repo
- `prototype/banter.jsx` (+ `banter.html`): **prototipo completo y funcional** — 15 juegos + 3 exclusivos de pack, grupos, chat con eventos, podio, crono, Modo Picante, Ligas, mesas Mundial, tienda de packs, panel QA. Es la **fuente de verdad de producto y UX**, no código de producción (archivo único, estado en memoria).
- `prototype/banter-backoffice.html`: backoffice v0 con 14 secciones (spec visual de las tablas y paneles a construir).
- `packages/games-sdk/sdk.js`: **SDK v1 congelado** del contrato shell↔juego. No romper compatibilidad.
- `manifest/manifest.json`: catálogo inicial (18 juegos, pares de crono, estados).
- `docs/`: arquitectura, esquema SQL de Supabase, runbook de despliegue, SEO, decisiones.

## Stack de producción (decidido)
- **Supabase**: auth (email + Google), Postgres (esquema en `docs/DB_SCHEMA.sql`), Realtime (chat y scores en vivo), Storage (bundles de juegos si no van en el repo).
- **Railway**: hosting del shell (Vite build estático) + servicio API Node (cron de ligas, validación anti-cheat, push, manifest firmado).
- **Shell**: Vite + React + TypeScript, PWA-first (móvil), instalable. Los juegos corren en **iframes** cargando bundles estáticos y hablando por el SDK.
- **Juegos nuevos**: partir de `packages/games/_plantilla` (Canvas/DOM ligero; Phaser solo si el arquetipo lo pide).

## Sistema de diseño: Bauhaus (FIJADO — no proponer otros)
- Fondo `#F2EFE9` · tinta `#1A1A1A` · rojo `#E63946` (acción/pique/error) · azul `#1D5DEC` (jugar/acierto) · amarillo `#F4C20D` (oro/monedas). **Sin verde**.
- Tipos: **Jost** (display/botones), Inter (cuerpo), DM Mono (números/tiempos).
- **Radius 0 en botones y superficies**; círculo/cuadrado/triángulo como motivos; podio 1º amarillo / 2º azul / 3º rojo; cartas de categoría con split diagonal 50/50 de dos primarios; confeti geométrico ●■▲.
- Animaciones: refactorizar a tokens (duraciones 150/250/400ms, easing estándar spring suave); el prototipo tiene keyframes ad-hoc que sirven de referencia de intención.

## Reglas de producto (no negociables)
- **Reto diario**: rotación por categoría con seed diaria global (`DAY = floor(now/86400000)`); el servidor sirve juego+seed (tabla `daily_games`), nunca el cliente.
- **Crono ascendente**: el tiempo se muestra contando hacia arriba; bonus = `max(0, par − segundos) × 2`. El tiempo (`secs`) se guarda con cada score.
- **2 intentos/día por grupo**; cuenta el mejor.
- **Modo Picante (sabotaje justo)**: opt-in por grupo privado; solo hacia arriba en el ranking; 2 tiros/día, máx. 1 por víctima; telegrafiado; solo visual (nunca toca inputs); solo puede caer en uno de los 2 intentos; víctima compensada (+15 monedas + tiro de revancha). **Prohibido en mesas Mundial** (allí solo reacciones positivas).
- **Ligas**: entre grupos, semanales; puntúa la media del top-5 diario; mín. 60% participación; brackets por tamaño de grupo; roster lock (fichajes puntúan al día siguiente); sin sabotaje en el intento que puntúa; requiere validación anti-cheat server-side.
- **Economía**: objetivo = pack alcanzable en 5-9 días de juego activo. Chinchar es gratis (motor social, no sumidero).
- **Notificaciones**: máximo 1-2/día.
- **Legal de la Game Factory**: se clonan **mecánicas**, nunca arte, nombres ni assets.

## Milestones (en orden)
- **M1**: shell Vite+TS con auth Supabase, crear/unirse a grupo (código de invitación), juego del día servido, y 2 juegos migrados a bundle+SDK (Trivia y Flechas). ✅
- **M2**: chat Realtime con eventos de score (con `secs`), podio y ranking, rachas. ✅
- **M3**: crono+bonus server-validado, monedas, tienda de packs, regalo diario. ✅
- **M4**: migración de TODOS los juegos del prototipo al SDK v1, por lotes (Lote A, B, C…) —
  hoy solo Trivia y Flechas están migrados de los ~15 core + 3 exclusivos de pack.
- **M5**: Backoffice real — conectar `prototype/banter-backoffice.html` a datos reales; mover
  el catálogo de juegos de `manifest/manifest.json` a una tabla `games` en DB (swap ya
  encapsulado en `packages/api/src/manifest.ts::getPar`); panel QA.
- **M6**: Fábrica Comunitaria — los propios usuarios proponen juegos nuevos con ayuda de IA
  (pipeline referencia→spec(IA)→arquetipo+config→QA→manifest, ver `docs/DECISIONES.md`).
  Sigue aplicando el "Legal de la Game Factory" de más abajo (clonar mecánicas, nunca
  arte/nombres/assets) — aquí con más motivo, al venir la referencia de un usuario.
- **M7** (antes M4): Modo Picante + mesas Mundial (moderación básica por reglas).
- **M8** (antes M5, sin la parte de backoffice que ahora vive en M5): Ligas + anti-cheat
  (reglas de `docs/DB_SCHEMA.sql`: score>p99, secs infrahumanos, varianza 0).
- **M9** (antes M6; spec completa en `docs/FEATURE_CHEF_Y_RETOS.md`): Chef del Día + Ronda
  Extra con mutators, El Guante (reto con bote), replay UGC y retos virales jugables sin login.
  - **M9a**: mutators en SDK/manifest + Chef del Día + Ronda Extra + medalla (sin compartir).
  - **M9b**: El Guante + tarjeta-imagen compartible + tabla `challenges` + `/reto/:id` jugable como invitado (sin vídeo).
  - **M9c**: input-log + vídeo-replay + fantasma 👻 + verificación de replays (puente a M8 anti-cheat).

## Estilo de trabajo
TypeScript estricto, componentes pequeños, tokens de diseño en un solo archivo (`packages/shell/src/theme.ts`), tests para scoring/crono/rotación de seed. Reutilizar la lógica del prototipo traduciéndola, no copiando el archivo entero.
