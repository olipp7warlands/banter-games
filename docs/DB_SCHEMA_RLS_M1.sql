-- Banter · políticas RLS necesarias para M1, complementan docs/DB_SCHEMA.sql
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de docs/DB_SCHEMA.sql.
-- Idempotente: se puede re-ejecutar sin error 42710 (duplicate_object).

-- daily_games: lectura pública, pero SOLO hasta hoy inclusive.
-- Si se siembran 30 días por adelantado, nadie debe poder leer el juego/seed de un día futuro.
alter table daily_games enable row level security;
drop policy if exists "daily_games publico hasta hoy" on daily_games;
create policy "daily_games publico hasta hoy" on daily_games for select
  using (fecha <= current_date);

-- profiles: nombre/avatar son de lectura pública (se muestran en grupos/chat);
-- cada usuario solo puede crear/editar su propia fila.
alter table profiles enable row level security;
drop policy if exists "leer perfiles" on profiles;
create policy "leer perfiles" on profiles for select using (true);
drop policy if exists "crear mi perfil" on profiles;
create policy "crear mi perfil" on profiles for insert with check (id = auth.uid());
drop policy if exists "editar mi perfil" on profiles;
create policy "editar mi perfil" on profiles for update using (id = auth.uid());

-- Helper security definer: "¿auth.uid() es miembro del grupo gid?", usado por las políticas
-- de abajo. IMPRESCINDIBLE que sea security definer (bypassa RLS internamente) — si esta
-- comprobación se hiciera con un subquery normal contra group_members, y la política de
-- SELECT de group_members también necesita esta misma comprobación, Postgres entra en
-- recursión infinita (error 42P17 "infinite recursion detected in policy for relation
-- group_members"). Detectado probando en vivo contra un proyecto Supabase real.
create or replace function is_group_member(gid uuid) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = gid and user_id = auth.uid()
  );
$$;

grant execute on function is_group_member(uuid) to authenticated;

-- groups: SIN select público (evita listar/enumerar todos los grupos). Solo mis grupos.
-- La búsqueda por invite_code para unirse se hace vía la función group_lookup_by_code() de abajo.
alter table groups enable row level security;
-- "or created_by = auth.uid()" es necesario, no cosmético: supabase-js hace
-- insert().select() en una sola vuelta (INSERT ... RETURNING), y RETURNING está sujeto
-- a la política de SELECT — en el instante de crear el grupo, el creador TODAVÍA no
-- tiene fila en group_members (esa se inserta después), así que sin esta cláusula
-- is_group_member(id) da false y el propio insert de creación falla por RLS.
-- Detectado probando en vivo (crear grupo real) contra un proyecto Supabase real.
drop policy if exists "leer mis grupos" on groups;
create policy "leer mis grupos" on groups for select
  using (is_group_member(id) or created_by = auth.uid());
drop policy if exists "crear grupo" on groups;
create policy "crear grupo" on groups for insert with check (created_by = auth.uid());

-- group_members: leer mi propia fila SIEMPRE (sin pasar por is_group_member, para no volver
-- a disparar la política de esta misma tabla) y las de mis grupos vía el helper; unirme solo
-- como yo mismo.
alter table group_members enable row level security;
drop policy if exists "leer membresias" on group_members;
create policy "leer membresias" on group_members for select
  using (
    user_id = auth.uid()
    or is_group_member(group_id)
  );
drop policy if exists "unirme a un grupo" on group_members;
create policy "unirme a un grupo" on group_members for insert with check (user_id = auth.uid());

-- plays: repetido de docs/DB_SCHEMA.sql por completitud (ya documentado ahí).
alter table plays enable row level security;
drop policy if exists "leer plays de mis grupos" on plays;
create policy "leer plays de mis grupos" on plays for select
  using (is_group_member(group_id));
drop policy if exists "insertar mis plays" on plays;
create policy "insertar mis plays" on plays for insert
  with check (user_id = auth.uid());

-- Lookup de grupo por invite_code SIN exponer la tabla groups entera.
-- security definer: se ejecuta con permisos del dueño (bypassa RLS internamente),
-- pero solo devuelve columnas no sensibles del grupo que coincide exactamente con el código.
create or replace function group_lookup_by_code(code text)
returns table (id uuid, nombre text, categoria text, is_public boolean, picante boolean)
language sql
security definer
set search_path = public
as $$
  select id, nombre, categoria, is_public, picante
  from groups
  where invite_code = code;
$$;

grant execute on function group_lookup_by_code(text) to authenticated;
