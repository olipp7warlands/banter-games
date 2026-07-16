# Arquitectura Banter

```
┌──────────── móvil / web (PWA) ────────────┐
│  SHELL (Vite+React+TS)                    │
│  grupos · hoy · chat · liga · tienda      │
│  ┌──────── iframe ────────┐               │
│  │ JUEGO (bundle estático)│◄─ SDK v1 ────►│  postMessage: INIT/START ↔ READY/GAME_OVER
│  └────────────────────────┘               │
└───────┬───────────────────────────┬───────┘
        │ anon key                  │ https
   ┌────▼─────────┐          ┌──────▼──────┐
   │  SUPABASE    │          │ API (Railway│
   │ auth · DB    │◄────────►│  Node)      │
   │ realtime chat│ service  │ valida score│
   │ storage      │  role    │ cupos pique │
   └──────────────┘          │ cron ligas  │
                             │ manifest    │
                             └─────────────┘
```

## Flujos clave
- **Juego del día**: shell pide a la API `GET /today?cat=` → {game_id, seed, par} desde `daily_games`. El cliente jamás calcula el reto.
- **Partida**: shell abre iframe del bundle → INIT{seed,tema,par} → juego READY → START → GAME_OVER{score,stats.secs} → shell envía a API `POST /play` → API valida (rango de score, secs mínimo humano, cupo de intentos), aplica bonus `max(0,par−secs)*2`, escribe `plays` + `transactions` y emite evento de chat.
- **Picante**: `POST /pique` valida cupos (2/día, 1/víctima, solo hacia arriba) y marca `piques`; al iniciar partida la víctima recibe flag → overlay visual local; al terminar, API compensa.
- **Ligas**: cron semanal suma media top-5 diaria por grupo (solo `valid=true`, participación ≥60%), asciende/desciende y abre jornada.
- **Manifest**: `GET /manifest?canal=web|ios|android` — cada canal fijado a una versión (tabla o JSON versionado).

## Por qué así
- Juegos aislados en iframe = la Game Factory puede añadir juegos sin tocar el shell (deploy independiente, rollback por juego).
- Toda economía y validación en API con service_role = imposible darse monedas o scores desde el cliente.
- Realtime de Supabase cubre chat y "Leo acaba de jugar" sin infra propia.
