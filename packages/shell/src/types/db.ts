// Interfaces a mano que reflejan las tablas de docs/DB_SCHEMA.sql que M1 usa.
// TODO(M2+): sustituir por `supabase gen types typescript` cuando el proyecto exista en CI.

export type Categoria = "palabras" | "ingenio" | "cultura" | "rapidez" | "clasicos" | "arena";

export interface Profile {
  id: string;
  nombre: string;
  avatar: string;
  created_at: string;
}

export interface Group {
  id: string;
  nombre: string;
  categoria: Categoria;
  picante: boolean;
  invite_code: string;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface DailyGame {
  fecha: string;
  categoria: Categoria;
  game_id: string;
  seed: number;
  override: boolean;
}

export interface Play {
  id: string;
  user_id: string;
  group_id: string;
  game_id: string;
  fecha: string;
  attempt: 1 | 2;
  score: number;
  secs: number | null;
  sabotaged: boolean;
  valid: boolean;
  created_at: string;
}

// Resultado de la función RPC group_lookup_by_code() (docs/DB_SCHEMA_RLS_M1.sql) —
// solo columnas no sensibles, sin invite_code ni created_by.
export interface GroupLookupResult {
  id: string;
  nombre: string;
  categoria: Categoria;
  is_public: boolean;
  picante: boolean;
}

// tipo='score' y 'sistema' solo los escribe el servidor (trigger chat_score_event en
// docs/DB_SCHEMA_M2.sql); el cliente solo puede insertar tipo='text' (RLS lo exige).
export type ChatMessageTipo = "text" | "score" | "pique" | "sistema";

export interface ChatMessageContenidoText {
  texto: string;
}
export interface ChatMessageContenidoScore {
  pts: number;
  secs: number | null;
  top: boolean;
}

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  tipo: ChatMessageTipo;
  contenido: ChatMessageContenidoText | ChatMessageContenidoScore | Record<string, unknown>;
  created_at: string;
}

// Con el join a profiles que usa useChatMessages (select *, profile:profiles(nombre,avatar)).
export interface ChatMessageWithProfile extends ChatMessage {
  profile: Pick<Profile, "nombre" | "avatar"> | null;
}
