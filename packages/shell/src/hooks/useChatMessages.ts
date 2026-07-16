import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { ChatMessageWithProfile } from "../types/db";
import { useSession } from "./useSession";

const MAX_TEXT_LENGTH = 2000; // debe coincidir con el check de docs/DB_SCHEMA_M2.sql

export function useChatMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["chatMessages", groupId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ChatMessageWithProfile[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, profile:profiles(nombre,avatar)")
        .eq("group_id", groupId as string)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ChatMessageWithProfile[];
    },
    enabled: !!groupId,
  });

  // Refetch-on-any-insert en vez de anexar el payload crudo: el evento de postgres_changes
  // no trae el join a profiles, y a la escala de un grupo de amigos no compensa la
  // complejidad de un lookup de perfil aparte. Cleanup con removeChannel evita
  // suscripciones duplicadas si el efecto se vuelve a ejecutar (StrictMode).
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chatMessages", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  return query;
}

// Solo tipo='text'. Los mensajes tipo='score' los genera el trigger chat_score_event
// (docs/DB_SCHEMA_M2.sql) al insertar en `plays` — nunca desde aquí.
export function useSendMessage(groupId: string | undefined) {
  const { session } = useSession();
  return useMutation({
    mutationFn: async (texto: string) => {
      const clean = texto.trim();
      if (!groupId || !session?.user.id) throw new Error("Falta grupo o sesión");
      if (!clean) throw new Error("El mensaje está vacío");
      if (clean.length > MAX_TEXT_LENGTH) throw new Error("Mensaje demasiado largo");
      const { error } = await supabase
        .from("chat_messages")
        .insert({ group_id: groupId, user_id: session.user.id, tipo: "text", contenido: { texto: clean } });
      if (error) throw error;
    },
  });
}
