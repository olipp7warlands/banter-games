# 🚀 Runbook de producción — Banter

## 0. Marca (ANTES de nada)
- [ ] Buscar "Banter" en EUIPO (clase 9 y 41) y USPTO; buscar apps homónimas en App Store/Play.
- [ ] Dominio: probar banter.app / banter.games / getbanter.app / banterdiario.com. Comprar el elegido.
- [ ] Si hay conflicto serio → reservas: Rounds, Huddle, Gameday (ver prototype/definitivos.html).

## 1. Repo
- [x] Repo creado: https://github.com/olipp7warlands/banter-games  (⚠️ es PÚBLICO — valorar pasarlo a privado hasta el lanzamiento)
- [ ] Subir este directorio con los comandos:
```
unzip banter-repo.zip && cd banter
git init && git add -A
git commit -m "Banter v0: prototipo + SDK v1 + manifest + docs"
git branch -M main
git remote add origin https://github.com/olipp7warlands/banter-games.git
git push -u origin main
```
- [ ] Proteger `main`; trabajar por ramas.

## 2. Supabase (15 min)
- [ ] Crear proyecto (región EU-West).
- [ ] SQL Editor → pegar `docs/DB_SCHEMA.sql` → Run.
- [ ] Authentication → habilitar Email y Google.
- [ ] Copiar `SUPABASE_URL`, `anon key` (shell) y `service_role` (SOLO para la API de Railway).
- [ ] Sembrar `daily_games` de 30 días (`npm run seed-daily`) y `packs` (`npm run seed-packs`
      — hero/pirate/space, 300 monedas, ver `scripts/seed-packs.mjs`).
- [ ] M3 (economía): pegar `docs/DB_SCHEMA_M3.sql` en el SQL Editor **por secciones**:
      sección M3a de inmediato (aditiva, cierra el agujero de RLS de wallets/transactions/
      packs/user_packs); sección M3b (`drop policy "insertar mis plays"`) SOLO cuando el
      shell + la API de este milestone ya estén desplegados y sirviendo tráfico real — si se
      pega antes, los jugadores en el shell viejo se quedan sin poder registrar partidas.

## 3. Railway (20 min)
- [ ] Nuevo proyecto → 2 servicios desde el repo, **ambos con Root Directory = raíz del
      repo** (no `packages/api` para el segundo: `packages/api/src/manifest.ts` importa
      `manifest/manifest.json` por ruta relativa fuera de su paquete, y necesita el repo
      completo en el build):
      · `shell` — Build: `npm run build`, Start: `npm run start`.
      · `api` (M3: valida scores+bonus, monedas, tienda de packs, regalo diario; cupos de
        piques/cron de ligas quedan para M4-M5) — Build: `npm run build:api`, Start:
        `npm run start:api`.
- [ ] Variables: shell → SUPABASE_URL, SUPABASE_ANON, `VITE_API_URL` (URL pública del
      servicio `api`); api → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, `SHELL_ORIGIN` (URL
      pública del servicio `shell`, para CORS).
- [ ] Conectar dominio + SSL.

## 4. Claude Code (el grueso)
- [ ] Abrir el repo con Claude Code: «Lee CLAUDE.md y docs/. Arranca el milestone M1.»
- [ ] Orden de milestones: M1 → M5 (definidos en CLAUDE.md). Gate entre cada uno: probarlo tú en móvil real.
- [ ] Regla de oro: el prototipo (`prototype/banter.jsx`) es la spec de UX — traducir, no copiar.

## 5. Gate de validación (NO saltar)
- [ ] Con M1-M2 desplegados: **prueba de 7 días con tu grupo real**.
- [ ] Métrica única: ¿vuelven al día 2-3 sin que se lo pidas? Si no, iterar el loop antes de M3-M5.

## 6. PWA / Stores
- [ ] Manifest PWA + iconos Bauhaus (cuadrado rojo ■) + splash. Instalable desde el día 1.
- [ ] Stores (Capacitor) solo tras validar retención; Android primero (revisión más rápida).

## 7. Embudos de captación
- [ ] Exportar 2 juegos sueltos (Flechas, Stack) como builds independientes con CTA "Juega el reto diario con tus amigos → banter.app".
- [ ] Subirlos a itch.io (inmediato) y aplicar a Poki (revisión). Arte de miniaturas: Bauhaus bold.
- [ ] Landing SEO según `docs/SEO_AGENTICO.md`.

## 8. Operación diaria
- [ ] Backoffice conectado (M5): calendario del día, flags, anti-cheat, push.
- [ ] Alertas: caída de partidas/día >30%, cola anti-cheat >20, error rate API.

## Costes estimados de arranque
Supabase Free + Railway ~5-10 €/mes + dominio ~15 €/año. Escala después.
