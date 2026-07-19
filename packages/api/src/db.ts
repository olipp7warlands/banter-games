import { supabaseAdmin } from "./supabaseAdmin";

// Capa fina de acceso a datos: centraliza cada query real contra Supabase para que las
// rutas (play/gift/store) sean orquestación pura y testeable mockeando este módulo entero,
// sin tener que imitar el builder encadenable+thenable de supabase-js en cada test.

export interface PlayRow {
  id: string;
  user_id: string;
  group_id: string;
  game_id: string;
  fecha: string;
  attempt: number;
  score: number;
  secs: number | null;
  bonus: number;
  valid: boolean;
  created_at: string;
}

export interface PackRow {
  id: string;
  nombre: string | null;
  emoji: string | null;
  precio: number | null;
  exclusivo_game: string | null;
  activo: boolean;
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data != null;
}

export async function countTodaysPlays(groupId: string, userId: string, fecha: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("plays")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("fecha", fecha);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function insertPlay(row: {
  userId: string;
  groupId: string;
  gameId: string;
  fecha: string;
  attempt: number;
  score: number;
  secs: number | null;
  bonus: number;
  valid: boolean;
}): Promise<PlayRow> {
  const { data, error } = await supabaseAdmin
    .from("plays")
    .insert({
      user_id: row.userId,
      group_id: row.groupId,
      game_id: row.gameId,
      fecha: row.fecha,
      attempt: row.attempt,
      score: row.score,
      secs: row.secs,
      bonus: row.bonus,
      valid: row.valid,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as PlayRow;
}

export async function creditWallet(userId: string, delta: number, motivo: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("credit_wallet", {
    p_user_id: userId,
    p_delta: delta,
    p_motivo: motivo,
  });
  if (error) throw new Error(error.message);
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("wallets")
    .select("monedas")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.monedas ?? 0;
}

export async function findGiftClaim(userId: string, fecha: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("gift_claims")
    .select("user_id")
    .eq("user_id", userId)
    .eq("fecha", fecha)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data != null;
}

export async function insertGiftClaim(
  userId: string,
  fecha: string,
  rewardType: string,
  rewardAmount: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("gift_claims")
    .insert({ user_id: userId, fecha, reward_type: rewardType, reward_amount: rewardAmount });
  if (error) throw new Error(error.message);
}

export async function findPack(packId: string): Promise<PackRow | null> {
  const { data, error } = await supabaseAdmin
    .from("packs")
    .select("*")
    .eq("id", packId)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PackRow) ?? null;
}

export async function hasUserPack(userId: string, packId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_packs")
    .select("user_id")
    .eq("user_id", userId)
    .eq("pack_id", packId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data != null;
}

export async function insertUserPack(userId: string, packId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("user_packs").insert({ user_id: userId, pack_id: packId });
  if (error) throw new Error(error.message);
}
