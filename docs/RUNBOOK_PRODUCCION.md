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
- [ ] SQL Editor → pegar `docs/DB_SCHEMA_RLS_M1.sql` → Run (políticas RLS que faltaban para M1: `daily_games` público solo hasta hoy, `profiles`/`groups`/`group_members`, función `group_lookup_by_code` para unirse por código).
- [ ] Authentication → habilitar Email (magic-link) y Google:
  - [ ] Email: activar "Enable Email provider" (ya viene con magic-link/OTP, no hace falta nada más).
  - [ ] Google: en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → crear/usar un proyecto → "Create OAuth client ID" → tipo **Web application**.
  - [ ] En Supabase, Authentication → Providers → Google → activar el toggle: te muestra la **Callback URL** exacta (`https://<project-ref>.supabase.co/auth/v1/callback`) que hay que pegar en "Authorized redirect URIs" del cliente OAuth de Google.
  - [ ] Copiar el **Client ID** y **Client Secret** que genera Google → pegarlos en el mismo panel de Supabase (Google) → Save.
  - [ ] Authentication → URL Configuration → añadir a "Redirect URLs": `http://localhost:5173/auth/callback` (dev) y `https://<tu-dominio>/auth/callback` (prod) — es la ruta que ya existe en el shell (`AuthCallbackPage`).
- [ ] Copiar `SUPABASE_URL`, `anon key` (shell) y `service_role` (SOLO para la API de Railway).
- [ ] Sembrar `daily_games` de 30 días: copiar `scripts/.env.example` a `scripts/.env`, rellenar `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, `npm run seed-daily`. Sembrar también `packs` (hero/pirate/space, 300 monedas).
- [ ] **M2 (chat Realtime + podio + rachas)** — cuando llegues a esa fase: SQL Editor → pegar `docs/DB_SCHEMA_M2.sql` → Run (RLS de `chat_messages` restringida a `tipo='text'`, trigger `chat_score_event` que emite el evento de score al chat, y activa Realtime en `chat_messages`). Todos los scripts SQL de este repo (`DB_SCHEMA.sql`, `DB_SCHEMA_RLS_M1.sql`, `DB_SCHEMA_M2.sql`) son idempotentes — se pueden re-ejecutar sin el error 42710 (duplicate_object) si algo falla a mitad.
- [ ] **M5 (backoffice real)** — cuando llegues a esa fase: SQL Editor → pegar `docs/DB_SCHEMA_M5.sql` → Run (tabla `admins` + función `is_admin()`, catálogo `games` sembrado desde `manifest/manifest.json`, policies para que un admin edite `daily_games` solo en fechas futuras, invalide `plays`, y gestione `flags`/`reports`). **Hacer esto ANTES de desplegar la versión de `packages/api` cuyo `manifest.ts::getPar()` lee de la tabla `games`** — si el deploy va antes que el SQL, todo `par` saldría `null`. Alta del primer admin: `insert into admins (user_id) select id from auth.users where email = '...'` (o el script disposable que use ese mismo criterio) — no hay UI para autopromoverse a propósito. `docs/DB_SCHEMA_M5.sql` es idempotente igual que el resto.

## 3. Railway — servicio `shell` (10 min)
Solo el `shell` por ahora (Vite build estático, con los juegos ya copiados dentro por
`copy-games`). El servicio `api` de `docs/ARQUITECTURA.md` (valida scores+bonus, cupos de
piques, cron de ligas) todavía no existe en el repo — es scope de M3 en adelante, no de este
paso. La config del servicio (`railway.json`, scripts `build`/`start` en `package.json`) ya
está en el repo; verificada en local con el mismo comando exacto que usará Railway
(`serve -s dist` sobre el build de producción) antes de tocar nada aquí, incluyendo el
fallback SPA para rutas como `/join/:code` y `/groups/:id`.

- [ ] En [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → seleccionar `olipp7warlands/banter-games`. Autoriza el GitHub App de Railway sobre ese repo si te lo pide.
- [ ] Root Directory: dejar la raíz del repo (por defecto) — `railway.json` y los scripts npm ya están pensados para ejecutarse desde ahí (usan `npm run <script> -w packages/shell`), no desde `packages/shell/`.
- [ ] Railway detecta `railway.json` automáticamente (builder Nixpacks, `npm run build` / `npm run start`). No hace falta tocar nada de Build/Start Command salvo que quieras verlo: Settings → Build/Deploy.
- [ ] Settings → **Variables** → añadir exactamente estas dos (son las que lee `packages/shell/.env.local` en local, y Vite las incrusta en el build — deben estar puestas ANTES del primer deploy, no después):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  (Los mismos valores que ya tienes en `packages/shell/.env.local`. **Nunca** `SUPABASE_SERVICE_ROLE_KEY` aquí — esa es solo para `scripts/.env`, local, nunca en un servicio que sirve al navegador.)
- [ ] Deploy (se dispara solo al crear el proyecto, o "Deploy" manual si hace falta). Cuando termine, Settings → Networking → **Generate Domain** te da la URL pública `https://<algo>.up.railway.app` — sirve tal cual por ahora, dominio propio queda para más adelante.
- [ ] Probar en el navegador: la home carga, y sobre todo — abrir directamente (pegar en la barra de direcciones, no navegar con clics) `https://<tu-dominio>.up.railway.app/join/ABCDEF`. Tiene que cargar la app (pantalla de login o "no existe ese código"), **nunca** un 404 crudo de Railway/Nixpacks — si sale 404, revisar que `railway.json` se detectó y que el deploy usó el build más reciente.
- [ ] Con el dominio ya generado, dos ajustes de auth pendientes en otros paneles (detallados abajo, sección "Tras el primer deploy").
- [ ] Dominio propio + SSL: más adelante, cuando el nombre esté decidido (ver paso 0).

### Tras el primer deploy: 2 ajustes de auth (si no, el login redirige mal o falla)
- [ ] **Supabase** → Authentication → URL Configuration:
  - **Site URL**: `https://<tu-dominio>.up.railway.app`
  - **Redirect URLs**: añadir `https://<tu-dominio>.up.railway.app/auth/callback` (la ruta que ya existe en el shell, `AuthCallbackPage`) — sin borrar la de `http://localhost:5173/auth/callback` que sigue haciendo falta para dev.
- [ ] **Google Cloud Console** → tu cliente OAuth (el mismo del paso 2) → **Authorized JavaScript origins** → añadir `https://<tu-dominio>.up.railway.app` (origin exacto, sin `/auth/callback` ni barra final — eso va en "Authorized redirect URIs", que ya apunta a Supabase y no cambia).

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
