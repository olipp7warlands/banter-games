import { useEffect, useRef, useState } from "react";
import { color, font, radius } from "../theme";
import { useChatMessages, useSendMessage } from "../hooks/useChatMessages";
import { useSession } from "../hooks/useSession";
import type { ChatMessageWithProfile } from "../types/db";

export function ChatTab({ groupId }: { groupId: string }) {
  const { data: messages, isLoading } = useChatMessages(groupId);
  const sendMessage = useSendMessage(groupId);
  const { session } = useSession();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sendMessage.isPending) return;
    const value = text.trim();
    setText("");
    await sendMessage.mutateAsync(value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 440 }}>
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
        {isLoading && (
          <div style={{ fontFamily: font.body, color: color.tintaSuave, textAlign: "center" }}>Cargando chat…</div>
        )}
        {!isLoading && messages?.length === 0 && (
          <div style={{ fontFamily: font.body, color: color.tintaSuave, textAlign: "center" }}>
            Todavía no hay mensajes. Di algo 👋
          </div>
        )}
        {messages?.map((m) => (
          <ChatBubble key={m.id} message={m} mine={m.user_id === session?.user.id} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${color.linea}`, paddingTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tu mensaje…"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: radius,
            border: `1.5px solid ${color.linea}`,
            fontFamily: font.body,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sendMessage.isPending}
          style={{
            border: "none",
            borderRadius: radius,
            background: color.azul,
            color: "#fff",
            width: 42,
            fontSize: 18,
            cursor: text.trim() ? "pointer" : "not-allowed",
            opacity: text.trim() ? 1 : 0.5,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message, mine }: { message: ChatMessageWithProfile; mine: boolean }) {
  const nombre = message.profile?.nombre ?? "Alguien";
  const hora = new Date(message.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  if (message.tipo === "score") {
    const c = message.contenido as { pts: number; secs: number | null; top: boolean };
    return (
      <div style={{ alignSelf: mine ? "flex-end" : "flex-start", display: "flex", alignItems: "center", gap: 8, maxWidth: "88%" }}>
        <div
          style={{
            background: c.top ? color.card : color.superficie,
            border: c.top ? `1px solid ${color.linea}` : "none",
            borderRadius: radius,
            padding: "8px 13px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {c.top && <span style={{ fontSize: 16 }}>🏆</span>}
          <div>
            <div style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: color.tinta }}>
              {nombre} hizo {c.pts} puntos{c.secs != null ? ` · ⏱${c.secs}s` : ""}
            </div>
            <div style={{ fontFamily: font.mono, fontSize: 10, color: color.muted }}>{hora}</div>
          </div>
        </div>
      </div>
    );
  }

  const c = message.contenido as { texto?: string };
  return (
    <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 9,
          color: color.muted,
          marginBottom: 2,
          paddingLeft: 4,
          textAlign: mine ? "right" : "left",
        }}
      >
        {mine ? "Tú" : nombre} · {hora}
      </div>
      <div
        style={{
          background: mine ? color.azul : color.superficie,
          color: mine ? "#fff" : color.tinta,
          padding: "8px 13px",
          borderRadius: radius,
          fontFamily: font.body,
          fontSize: 14,
        }}
      >
        {c.texto}
      </div>
    </div>
  );
}
