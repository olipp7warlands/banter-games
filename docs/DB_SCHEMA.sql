-- Banter · esquema Supabase (Postgres). Ejecutar en SQL Editor del proyecto.
-- Nota: activar RLS en TODAS las tablas; políticas de ejemplo al final.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null,
  avatar text default '⭐',
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('palabras','ingenio','cultura','rapidez','clasicos','arena')),
  picante boolean default false,
  invite_code text unique not null,
  is_public boolean default false,          -- mesas Mundial
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin','member')),
  joined_at timestamptz default now(),      -- roster lock de Ligas: puntúa desde joined_at + 1 día
  primary key (group_id, user_id)
);

create table daily_games (                   -- lo sirve el servidor; el cliente NUNCA calcula el reto
  fecha date not null,
  categoria text not null,
  game_id text not null,
  seed bigint not null,
  override boolean default false,
  primary key (fecha, categoria)
);

create table plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  group_id uuid references groups(id),
  game_id text not null,
  fecha date not null,
  attempt smallint not null check (attempt in (1,2)),
  score int not null,
  secs int,                                  -- crono ascendente: tiempo real de la run
  sabotaged boolean default false,
  valid boolean default true,                -- anti-cheat puede invalidar
  created_at timestamptz default now(),
  unique (user_id, group_id, fecha, attempt)
);
create index plays_rank on plays (group_id, fecha, valid, score desc, secs asc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id),
  tipo text default 'text' check (tipo in ('text','score','pique','sistema')),
  contenido jsonb not null,                  -- {texto} | {pts,secs,top} | {emoji,target}
  created_at timestamptz default now()
);

create table piques (                        -- chinchazos y tomatazos (Modo Picante)
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  from_user uuid references profiles(id),
  to_user uuid references profiles(id),
  tipo text not null check (tipo in ('reaccion','tomate')),
  emoji text,
  fecha date not null,
  consumed boolean default false             -- el tomate se consume al caer en una run
);
-- Cupos (2 tiros/día, 1 por víctima) se validan en la API antes de insertar.

create table wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  monedas int default 0
);
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  delta int not null,
  motivo text not null,                      -- 'partida','ganar_dia','compensacion_tomate','compra_pack','regalo'
  created_at timestamptz default now()
);

create table packs (
  id text primary key,                       -- 'hero','pirate','space','halloween'...
  nombre text, emoji text, precio int, exclusivo_game text, activo boolean default true
);
create table user_packs (
  user_id uuid references profiles(id), pack_id text references packs(id),
  primary key (user_id, pack_id)
);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  division text check (division in ('bronce','plata','oro','diamante')),
  bracket text,                              -- '5-9','10-15'...
  season int, jornada int,
  cierre timestamptz
);
create table league_groups (
  league_id uuid references leagues(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  pts int default 0,
  primary key (league_id, group_id)
);

create table flags (
  key text primary key, estado text check (estado in ('on','off','ab')), pct smallint default 100, nota text
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  tipo text, ref jsonb, estado text default 'pendiente', created_at timestamptz default now()
);

-- ===== RLS (patrón) =====
alter table plays enable row level security;
create policy "leer plays de mis grupos" on plays for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));
create policy "insertar mis plays" on plays for insert
  with check (user_id = auth.uid());
-- Repetir patrón en chat_messages, piques, group_members, groups.
-- daily_games, flags, packs: lectura pública, escritura solo service_role (API/backoffice).
-- wallets/transactions: escritura SOLO service_role (la API concede monedas, nunca el cliente).
