-- Banter · M2: chat Realtime (trigger de evento de score) + RLS de chat_messages.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de docs/DB_SCHEMA.sql y docs/DB_SCHEMA_RLS_M1.sql
-- (depende de la función is_group_member() definida ahí).
-- Idempotente: se puede re-ejecutar sin error 42710 (duplicate_object).

alter table chat_messages enable row level security;

-- is_group_member() en vez de "group_id in (select ... from group_members ...)": ese subquery
-- directo contra group_members dispara la política RLS de esa tabla, y si algún día vuelve a
-- haber una política self-referencial ahí, recae en el mismo 42P17 que tuvo group_members en M1.
drop policy if exists "leer chat de mis grupos" on chat_messages;
create policy "leer chat de mis grupos" on chat_messages for select
  using (is_group_member(group_id));

-- Solo tipo='text' es insertable desde el cliente. 'score'/'sistema' SOLO los genera
-- el trigger de abajo (security definer, bypassa RLS) — sin este "tipo = 'text'",
-- cualquier miembro podría insertar un mensaje tipo:'score' con top:true falso
-- (corona de podio falsa). También se rechaza texto vacío/solo-espacios y > 2000 chars.
drop policy if exists "escribir mis mensajes" on chat_messages;
drop policy if exists "escribir mis mensajes de texto" on chat_messages;
create policy "escribir mis mensajes de texto" on chat_messages for insert
  with check (
    user_id = auth.uid()
    and tipo = 'text'
    and is_group_member(group_id)
    and jsonb_typeof(contenido -> 'texto') = 'string'
    and length(trim(both from (contenido ->> 'texto'))) > 0
    and length(contenido ->> 'texto') <= 2000
  );

-- Evento de score en chat: atómico con el insert en plays (misma transacción), no
-- depende de que el cliente (o la futura API de M3) se acuerde de duplicar la escritura.
-- El mensaje lleva {pts, secs, top} — secs es el "⏱Ns" que se muestra en el chat,
-- top indica si esta partida es la mejor del día en el grupo (corona 🏆 en el render).
create or replace function chat_score_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_top boolean;
begin
  select not exists (
    select 1 from plays
    where group_id = new.group_id and fecha = new.fecha and valid = true
      and (score > new.score or (score = new.score and secs < new.secs))
  ) into is_top;

  insert into chat_messages (group_id, user_id, tipo, contenido)
  values (
    new.group_id, new.user_id, 'score',
    jsonb_build_object('pts', new.score, 'secs', new.secs, 'top', is_top)
  );
  return new;
end;
$$;
-- Limitación conocida (cosmética, no de seguridad): bajo READ COMMITTED, dos inserts
-- casi simultáneos de usuarios distintos en el mismo group_id+fecha pueden ambos
-- calcular is_top=true (dos coronas el mismo día). No se corrige en M2.

drop trigger if exists plays_chat_event on plays;
create trigger plays_chat_event
  after insert on plays
  for each row execute function chat_score_event();

-- Realtime: publicar chat_messages para que los postgres_changes lleguen a los clientes.
-- Ninguna otra tabla está publicada todavía (paso nuevo, no heredado de M1).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;
