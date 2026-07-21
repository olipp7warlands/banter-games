-- Banter · M5 — Backoffice real: tabla admins + is_admin(), catálogo de juegos en DB
-- (reemplaza manifest/manifest.json) y las policies que permiten a un admin editar
-- daily_games (solo fechas futuras), invalidar plays, y gestionar flags/reports.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de docs/DB_SCHEMA.sql,
-- docs/DB_SCHEMA_RLS_M1.sql, docs/DB_SCHEMA_M2.sql y docs/DB_SCHEMA_M3.sql.
-- Ejecutar ANTES de desplegar la versión de packages/api cuyo manifest.ts::getPar() lee de
-- la tabla `games` en vez de manifest.json — si no, getPar() devolvería null para todo juego
-- porque la tabla todavía no existiría.
-- Idempotente: se puede re-ejecutar sin error 42710 (duplicate_object).

-- ===== admins + is_admin() =====
create table if not exists admins (
  user_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Mismo patrón exacto que is_group_member() en docs/DB_SCHEMA_RLS_M1.sql: security definer
-- (bypassa RLS internamente para poder comprobar la tabla admins sin recursión), search_path
-- fijado (mitigación de search_path hijacking, obligatoria con security definer), stable
-- (solo lectura, sin side effects). Se usa tanto en policies (using/with check) como desde
-- el shell vía supabase.rpc("is_admin") — una sola fuente de verdad para "¿soy admin?".
create or replace function is_admin() returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$;

grant execute on function is_admin() to authenticated;

alter table admins enable row level security;
drop policy if exists "admins ven admins" on admins;
create policy "admins ven admins" on admins for select
  using (is_admin());
-- Sin policy de insert/delete para clientes a propósito: las altas de admin se hacen a mano
-- (SQL Editor o script service_role), nunca desde el cliente.

-- ===== games (catálogo — reemplaza manifest/manifest.json) =====
-- `categoria` SIN check constraint (a diferencia de groups.categoria): los 3 juegos
-- exclusivos de pack usan "pack:hero"/"pack:pirate"/"pack:space" en el manifest real, no
-- una de las 6 categorías base del enum de groups.
create table if not exists games (
  id text primary key,
  nombre text not null,
  emoji text,
  categoria text not null,
  version text,
  estado text not null default 'prod' check (estado in ('prod','qa','off')),
  par int,
  temas text[] not null default '{}'
);

-- Semilla inicial = copia exacta de manifest/manifest.json (versión "1.4.0", 18 juegos).
-- ON CONFLICT DO NOTHING: si este script se re-ejecuta, no pisa ediciones ya hechas desde
-- el backoffice (mismo criterio que scripts/seed-daily-games.mjs con daily_games).
insert into games (id, nombre, emoji, categoria, version, estado, par, temas) values
  ('trivia', 'Trivia', '🧠', 'cultura', '1.4.0', 'prod', 50, array['classic','hero','pirate','space']),
  ('acertijos', 'Acertijos', '❓', 'cultura', '1.2.1', 'prod', 60, array['classic','hero','pirate','space']),
  ('truefalse', 'Verdadero o Falso', '✅', 'cultura', '1.1.0', 'prod', 35, array['classic']),
  ('anagram', 'Anagrama', '🔤', 'palabras', '1.3.2', 'prod', 75, array['classic','hero','pirate','space']),
  ('math', 'Cálculo', '🔢', 'rapidez', '1.2.0', 'prod', 45, array['classic']),
  ('bloques', 'Bloques', '🟥', 'ingenio', '1.5.0', 'prod', null, array['classic','hero','pirate','space']),
  ('ordenar', 'Ordenar', '🧴', 'ingenio', '1.1.3', 'prod', 80, array['classic']),
  ('oddone', 'El diferente', '🔍', 'ingenio', '1.0.4', 'prod', 45, array['classic','hero','pirate','space']),
  ('flechas', 'Flechas', '➡️', 'ingenio', '1.2.0', 'prod', 90, array['classic','hero','pirate','space']),
  ('stack', 'Stack', '🧱', 'rapidez', '2.0.1', 'prod', null, array['classic']),
  ('tornillos', 'Tornillos', '🔩', 'ingenio', '1.0.2', 'prod', 60, array['classic']),
  ('merge', '2048', '🧮', 'ingenio', '1.0.1', 'prod', null, array['classic']),
  ('burbujas', 'Burbujas', '🫧', 'clasicos', '1.0.5', 'prod', null, array['classic']),
  ('memoria', 'Memoria', '🃏', 'clasicos', '1.3.0', 'prod', 70, array['classic','hero','pirate','space']),
  ('arena', 'Arena', '🌐', 'arena', '0.9.0', 'qa', null, array['classic','hero','pirate','space']),
  ('volar', 'Volar', '🦸', 'pack:hero', '1.0.0', 'prod', null, array['hero']),
  ('cazatesoros', 'Cazatesoros', '🏴‍☠️', 'pack:pirate', '1.0.0', 'prod', null, array['pirate']),
  ('asteroides', 'Asteroides', '🚀', 'pack:space', '1.0.0', 'prod', null, array['space'])
on conflict (id) do nothing;

alter table games enable row level security;
drop policy if exists "leer catalogo" on games;
create policy "leer catalogo" on games for select
  using (true);
drop policy if exists "admins editan catalogo" on games;
create policy "admins editan catalogo" on games for update
  using (is_admin()) with check (is_admin());
drop policy if exists "admins crean juegos" on games;
create policy "admins crean juegos" on games for insert
  with check (is_admin());

-- ===== daily_games: admins ven todo y programan/editan SOLO fechas futuras =====
-- La policy de select pública "daily_games publico hasta hoy" (RLS_M1, fecha <= current_date)
-- no cambia — sigue rigiendo para todo el mundo salvo admins. Sin la policy de select de
-- abajo, un admin podría escribir en un día futuro pero jamás LEERLO de vuelta: PostgREST
-- hace upsert().select() en una sola vuelta (RETURNING), y ese RETURNING está sujeto a la
-- policy de SELECT igual que cualquier lectura — mismo caso ya documentado para "groups" en
-- RLS_M1 ("crear grupo" necesitaba "or created_by=auth.uid()" por el mismo motivo). El
-- Calendario de /admin necesita ver los 14 días, no solo hoy.
drop policy if exists "admins leen dias futuros" on daily_games;
create policy "admins leen dias futuros" on daily_games for select
  using (is_admin());
drop policy if exists "admins programan dias futuros" on daily_games;
create policy "admins programan dias futuros" on daily_games for insert
  with check (is_admin() and fecha > current_date);
drop policy if exists "admins editan dias futuros" on daily_games;
create policy "admins editan dias futuros" on daily_games for update
  using (is_admin() and fecha > current_date)
  with check (is_admin() and fecha > current_date);

-- ===== plays: admins ven todas (anti-cheat) e invalidan =====
drop policy if exists "admins leen todas las plays" on plays;
create policy "admins leen todas las plays" on plays for select
  using (is_admin());
drop policy if exists "admins invalidan plays" on plays;
create policy "admins invalidan plays" on plays for update
  using (is_admin()) with check (is_admin());

-- ===== groups / group_members: admins pueden leer cualquiera (búsqueda) =====
-- Postgres combina varias policies del mismo comando con OR, así que esto SUMA visibilidad
-- sin quitar las policies existentes de "mis grupos".
drop policy if exists "admins leen todos los grupos" on groups;
create policy "admins leen todos los grupos" on groups for select
  using (is_admin());
drop policy if exists "admins leen todas las membresias" on group_members;
create policy "admins leen todas las membresias" on group_members for select
  using (is_admin());

-- ===== flags / reports: nunca tuvieron RLS habilitada, se habilita aquí =====
-- flags: lectura pública (son feature flags — en algún momento el cliente los leerá para
-- saber si una feature está activa para él), escritura solo admin.
alter table flags enable row level security;
drop policy if exists "leer flags" on flags;
create policy "leer flags" on flags for select
  using (true);
drop policy if exists "admins escriben flags" on flags;
create policy "admins escriben flags" on flags for update
  using (is_admin()) with check (is_admin());
drop policy if exists "admins crean flags" on flags;
create policy "admins crean flags" on flags for insert
  with check (is_admin());

-- reports: solo admin lee/actualiza. Sin policy de insert todavía — no existe ningún flujo
-- que cree reports hoy (mesas Mundial/chat, M7+); se deja preparado para cuando exista.
alter table reports enable row level security;
drop policy if exists "admins leen reports" on reports;
create policy "admins leen reports" on reports for select
  using (is_admin());
drop policy if exists "admins resuelven reports" on reports;
create policy "admins resuelven reports" on reports for update
  using (is_admin()) with check (is_admin());
