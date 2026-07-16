# FEATURE — Chef del Día, El Guante y Retos Virales (M6)

## Visión
Trasladar parte del poder de la Game Factory a los jugadores: cada día, un miembro del grupo "compone" una variación del reto; los récords se comparten como vídeo-replay a redes ("nadie me lo ha batido"); y cada desafío queda congelado en un enlace jugable por cualquiera, para siempre. Innovación de los usuarios + loop viral + captación, sin romper la competición limpia.

## Los 4 pilares

### 1) El Chef del Día 👨‍🍳
- Cada día, **un miembro del grupo lleva el gorro** (rotación por orden de antigüedad en el grupo → justo y anticipable: "mañana me toca").
- Twist de economía: cualquier otro miembro puede **robar el gorro por 50 🪙** (máx. 1 robo/día, primero que paga). Sumidero de monedas con drama.
- El Chef ve **3 mutators sugeridos** (ver §Mutators) ya bautizados por la IA con el tema del grupo (ej.: "Modo Tortuga Turbo 🐢⚡") y **elige 1 sin poder probarlo antes**. La regla le aplica también a él.

### 2) La Ronda Extra (donde vive la regla)
- El mutator NO toca los 2 intentos normales ni la Liga (seed global limpia, comparabilidad intacta).
- Es un **3er intento opcional** con la regla del Chef: reparte monedas (+15 al jugar, +25 al mejor) y la medalla diaria **"Rey de la Regla" 👑🌶️**.
- El chat anuncia: *"👨‍🍳 Regla de Marta: Stack a doble velocidad — ¿quién sobrevive?"*

### 3) El Guante 🧤 (reto con bote)
- El **ganador de ayer** puede "lanzar el guante": elige mutator, juega su marca y pone **30 🪙 de bote**.
- Si nadie le bate hoy en la Ronda Extra → recupera ×2. Si alguien le bate → el bote es del verdugo (+evento de chat épico).
- Justicia auto-equilibrada: el poder de elegir regla se paga apostando contra uno mismo.

### 4) Replay UGC + Reto replicable 🎬🔗
- **Grabación por inputs** (no captura de pantalla): el juego registra `[{t, tipo, x, y}...]` — un JSON de ~1-5 KB. Como todo es determinista (seed + mutator), re-simular = replay perfecto.
- **Compartir**: botón "Presumir 📤" en el resultado → genera vídeo vertical (re-simulación a canvas + MediaRecorder, 9:16, overlay Bauhaus: tu marca grande, podio del grupo, logo ■, QR/enlace). Fallback si el vídeo falla: **tarjeta-imagen** del resultado (siempre funciona).
- **Privacidad**: por defecto el podio sale con nombre corto + avatar; toggle "modo anónimo" (P1·P2·P3). El que comparte solo expone su propia marca con nombre completo.
- **Reto replicable**: al compartir se crea `/reto/:id` — juego+seed+mutator **congelados** + ranking público propio + el replay del creador como *fantasma* 👻 corriendo en paralelo. **Jugable sin login** (modo invitado); al terminar: "Guarda tu marca y reta a tu grupo → crear cuenta". Si un reto se hace viral, es una landing de captación que se fabrica sola.

## Mutators (el catálogo de reglas)
Los usuarios **no generan código**: eligen variaciones pre-aprobadas; la IA solo las *viste* (nombre/emoji/copy con el tema del grupo). Mecánicamente son knobs que ya viajan en el manifest/INIT.

| id | efecto | juegos |
|---|---|---|
| doble_velocidad | speed ×2 | stack, flechas, bloques |
| par_apretado | par −40% | todos los timed |
| espejo | tablero/controles invertidos | flechas, tornillos, burbujas |
| al_reves | palabras/opciones invertidas | anagram, trivia |
| muerte_subita | 1 vida / 1 fallo | todos |
| gravedad | caída ×1.6 | stack, asteroides |
| niebla | el tablero se oculta 1s cada 5s | memoria, tornillos |

Cada mutator declara `compatibleCon[]` y `deltaDificultad` (para calibrar recompensas). Añadir mutators = contenido de backoffice, no releases.

## Cambios técnicos

### SDK v1.1 (aditivo, NO rompe v1)
- `INIT.payload.mutators?: Record<string,any>` — los juegos que no lo entienden lo ignoran.
- `INIT.payload.modo?: "normal" | "extra" | "reto" | "ghost"`.
- Nuevo evento juego→shell: `INPUT_LOG {events}` junto a GAME_OVER (solo si `grabar:true` en INIT).
- Ghost: el shell pasa `INIT.payload.ghost?: {events}` y el juego lo renderiza semitransparente (opcional por juego; empezar por stack/flechas).

### SQL (docs/DB_SCHEMA_M6.sql, aditivo e idempotente)
```sql
create table if not exists group_daily_mutator (
  group_id uuid references groups(id) on delete cascade,
  fecha date not null,
  chef uuid references profiles(id),
  mutator text not null,
  nombre_ia text, emoji text,
  guante boolean default false, bote int default 0,
  primary key (group_id, fecha)
);
create table if not exists challenges (
  id text primary key,                -- corto, tipo nanoid(8), para URL
  creator uuid references profiles(id),
  game_id text not null, seed bigint not null,
  mutator text, nombre text,
  best_score int, best_secs int,
  replay jsonb,                       -- input-log del creador (el fantasma)
  plays int default 0,
  created_at timestamptz default now()
);
create table if not exists challenge_plays (
  id uuid primary key default gen_random_uuid(),
  challenge_id text references challenges(id) on delete cascade,
  user_id uuid references profiles(id),          -- null = invitado
  guest_name text,
  score int not null, secs int,
  created_at timestamptz default now()
);
-- RLS: challenges y challenge_plays select using(true) (públicos por diseño);
-- insert de challenge_plays permitido a anon (invitados) con rate-limit en API;
-- group_daily_mutator: mismas policies de membership vía is_group_member(gid).
```

### Rutas nuevas
- `/reto/:id` — pública, sin RequireAuth, modo invitado.
- Share: Web Share API nivel 2 con `files` (vídeo); fallback imagen + copiar enlace.

### Sinergia anti-cheat (M5)
El input-log permite **verificación server-side**: re-simular en la API y comprobar que produce el score reportado. Los replays sospechosos del panel Anti-cheat dejan de ser "un número raro" y pasan a ser reproducibles. Diseñar M5 contando con esto.

## El loop viral, explícito
1. Marta gana con regla loca → **Presumir 📤** → vídeo 9:16 en TikTok/WhatsApp/IG.
2. Un desconocido lo ve → toca el enlace → **juega el MISMO reto en 5 segundos, sin registro**, contra el fantasma de Marta.
3. Pierde (o gana) → "guarda tu marca / reta a TU grupo" → registro → nuevo grupo → vuelve al paso 1.

## Justicia (resumen de salvaguardas)
Mutators solo en Ronda Extra (Liga intacta) · Chef por rotación (robo pagado, 1/día) · el Chef no prueba antes y juega su propia regla · Guante = poder con bote en contra · retos públicos con ranking separado del ecosistema de grupos.

## Fases de entrega
- **M6a**: mutators en SDK/manifest + Chef del Día + Ronda Extra + medalla (sin compartir).
- **M6b**: El Guante + tarjeta-imagen compartible + tabla challenges + `/reto/:id` jugable como invitado (sin vídeo aún).
- **M6c**: input-log + vídeo-replay + fantasma 👻 + verificación de replays (puente a M5).

## Métricas de éxito
% de grupos con Ronda Extra jugada · robos de gorro/semana · shares por usuario · **visitas a /reto/:id → registros** (el KPI del loop) · retos con >50 plays ("virales").

## Fuera de scope (anotado)
Prompt libre → juego generado en caliente (riesgo calidad/seguridad): eso sigue siendo la **Fábrica Comunitaria** (cola de deseos → Factory → QA → catálogo con crédito "Idea de @user"), candidata a M7.
