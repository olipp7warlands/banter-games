-- Banter · políticas RLS necesarias para M1, complementan docs/DB_SCHEMA.sql
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de docs/DB_SCHEMA.sql.

-- daily_games: lectura pública, pero SOLO hasta hoy inclusive.
-- Si se siembran 30 días por adelantado, nadie debe poder leer el juego/seed de un día futuro.
alter table daily_games enable row level security;
create policy "daily_games publico hasta hoy" on daily_games for select
  using (fecha <= current_date);

-- profiles: nombre/avatar son de lectura pública (se muestran en grupos/chat);
-- cada usuario solo puede crear/editar su propia fila.
alter table profiles enable row level security;
create policy "leer perfiles" on profiles for select using (true);
create policy "crear mi perfil" on profiles for insert with check (id = auth.uid());
create policy "editar mi perfil" on profiles for update using (id = auth.uid());

-- groups: SIN select público (evita listar/enumerar todos los grupos). Solo mis grupos.
-- La búsqueda por invite_code para unirse se hace vía la función group_lookup_by_code() de abajo.
alter table groups enable row level security;
create policy "leer mis grupos" on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));
create policy "crear grupo" on groups for insert with check (created_by = auth.uid());

-- group_members: leer mis membresías y las de mis grupos; unirme solo como yo mismo.
alter table group_members enable row level security;
create policy "leer membresias" on group_members for select
  using (
    user_id = auth.uid()
    or group_id in (select group_id from group_members where user_id = auth.uid())
  );
create policy "unirme a un grupo" on group_members for insert with check (user_id = auth.uid());

-- plays: repetido de docs/DB_SCHEMA.sql por completitud (ya documentado ahí).
alter table plays enable row level security;
create policy "leer plays de mis grupos" on plays for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));
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
