# Banter 🔴🔵🟡
Repo: https://github.com/olipp7warlands/banter-games
Juegos diarios con tu círculo. Reto diario por grupo, crono ascendente, pique amistoso.

**Empieza por `CLAUDE.md`** (contexto para Claude Code) y `docs/RUNBOOK_PRODUCCION.md` (pasos de despliegue).

- `prototype/` — prototipo funcional completo (referencia de producto, NO código de producción)
- `packages/shell` — app principal (a construir: Vite + React + TS)
- `packages/games-sdk` — SDK v1 del contrato shell↔juego (postMessage) ✅ listo
- `packages/games/_plantilla` — plantilla mínima de minijuego con SDK ✅ lista
- `packages/backoffice` — panel admin (a conectar con Supabase)
- `manifest/manifest.json` — catálogo inicial de juegos ✅
- `docs/` — arquitectura, esquema DB, runbook, SEO, decisiones
