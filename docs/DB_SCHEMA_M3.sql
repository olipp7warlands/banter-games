-- Banter · M3: crono+bonus server-validado, monedas, tienda de packs, regalo diario.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de docs/DB_SCHEMA.sql, DB_SCHEMA_RLS_M1.sql
-- y DB_SCHEMA_M2.sql. Idempotente: se puede re-ejecutar sin error 42710 (duplicate_object).
--
-- ORDEN DE DESPLIEGUE (importante, no lo pegues todo de una sentada):
--   1. Sección M3a: pégala YA. Es aditiva (columnas/tablas nuevas, RLS de solo lectura,
--      una función) e inocua para el shell actualmente desplegado (que todavía inserta
--      directo en `plays`) — cierra un agujero de seguridad real: wallets/transactions/
--      packs/user_packs nunca tuvieron `row level security` habilitada, así que hoy
--      cualquier cliente autenticado puede escribir esas tablas directo con la anon key.
--   2. Sección M3b: pégala SOLO cuando el shell nuevo (que ya postea a la API en /play) y
--      la propia API estén desplegados y sirviendo tráfico real. Si la pegas antes, los
--      jugadores con el shell viejo (que aún inserta directo en `plays`) se quedan sin
--      poder registrar partidas en el hueco entre despliegues.

-- ===================== SECCIÓN M3a — pegar ya ============================

-- Desglose del bonus por crono persistido junto al score final (score = raw + bonus).
-- Columna nueva con default: no rompe el insert directo que el shell actual todavía hace.
alter table plays add column if not exists bonus int not null default 0;

-- Falta hoy: es lo que hace idempotente "un regalo al día" (antes era solo un mock en
-- memoria en el prototipo, sin persistencia real de "ya lo reclamé hoy").
create table if not exists gift_claims (
  user_id uuid references profiles(id) on delete cascade,
  fecha date not null,
  reward_type text not null,
  reward_amount int not null,
  created_at timestamptz default now(),
  primary key (user_id, fecha)
);

-- wallets/transactions/packs/user_packs: nunca tuvieron RLS habilitada (a diferencia de
-- todas las demás tablas del schema). Con los grants por defecto de Supabase eso las deja
-- abiertas a escritura desde cualquier cliente autenticado con la anon key. Se habilita RLS
-- y se añaden políticas de SOLO LECTURA (de la propia fila / catálogo público); ninguna
-- lleva policy de insert/update para `authenticated` — a partir de ahora solo `service_role`
-- (la API, vía credit_wallet más abajo) puede escribir en ellas.
alter table wallets enable row level security;
drop policy if exists "leer mi wallet" on wallets;
create policy "leer mi wallet" on wallets for select using (user_id = auth.uid());

alter table transactions enable row level security;
drop policy if exists "leer mis transacciones" on transactions;
create policy "leer mis transacciones" on transactions for select using (user_id = auth.uid());

alter table packs enable row level security;
drop policy if exists "leer packs activos" on packs;
create policy "leer packs activos" on packs for select using (activo);

alter table user_packs enable row level security;
drop policy if exists "leer mis packs" on user_packs;
create policy "leer mis packs" on user_packs for select using (user_id = auth.uid());

alter table gift_claims enable row level security;
drop policy if exists "leer mis regalos" on gift_claims;
create policy "leer mis regalos" on gift_claims for select using (user_id = auth.uid());

-- Único punto de escritura de economía: upsert atómico de wallets + insert de transactions.
-- El `update wallets set monedas = monedas + p_delta` es atómico a nivel de fila en
-- Postgres (lock implícito); no hace falta un `select ... for update` explícito. Llamada
-- siempre desde la API con el cliente service_role (bypassea RLS).
create or replace function credit_wallet(p_user_id uuid, p_delta int, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into wallets (user_id, monedas) values (p_user_id, 0)
    on conflict (user_id) do nothing;
  update wallets set monedas = monedas + p_delta where user_id = p_user_id;
  insert into transactions (user_id, delta, motivo) values (p_user_id, p_delta, p_motivo);
end;
$$;

grant execute on function credit_wallet(uuid, int, text) to service_role;

-- ===================== SECCIÓN M3b — pegar SOLO tras desplegar =============
-- ===================== el shell nuevo + la API en producción ===============

-- El cliente deja de poder insertar directo en `plays`; a partir de ahora solo la API
-- (service_role, bypassea RLS) escribe ahí. El trigger `chat_score_event` (M2, security
-- definer) sigue disparándose igual, no depende de esta policy.
drop policy if exists "insertar mis plays" on plays;
