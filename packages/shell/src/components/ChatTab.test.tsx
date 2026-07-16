import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatTab } from "./ChatTab";

// Contrato que estamos probando (equivalente en espíritu a cómo M1 verificó el handshake
// del SDK de juegos en un navegador real): useChatMessages hace fetch inicial con el join
// a profiles, useSendMessage inserta tipo='text', y una suscripción Realtime simulada
// (invocando a mano el callback que el hook registró en supabase.channel().on()) dispara
// un refetch que hace aparecer el mensaje nuevo — sin esto no hay chat en vivo real.

let mockMessages: unknown[] = [];
let insertedRows: unknown[] = [];
let realtimeCallback: (() => void) | null = null;

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: mockMessages, error: null }),
          }),
        }),
      }),
      insert: (row: unknown) => {
        insertedRows.push(row);
        return Promise.resolve({ error: null });
      },
    }),
    channel: () => ({
      on: (_type: string, _filter: unknown, cb: () => void) => {
        realtimeCallback = cb;
        return { subscribe: () => ({ id: "mock-channel" }) };
      },
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("../hooks/useSession", () => ({
  useSession: () => ({ session: { user: { id: "me" } }, loading: false }),
}));

function renderChatTab() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ChatTab groupId="group-1" />
    </QueryClientProvider>
  );
  return queryClient;
}

beforeEach(() => {
  mockMessages = [];
  insertedRows = [];
  realtimeCallback = null;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChatTab", () => {
  it("renderiza mensajes de texto y de score (con corona si top)", async () => {
    mockMessages = [
      {
        id: "1",
        group_id: "group-1",
        user_id: "otro",
        tipo: "text",
        contenido: { texto: "hola equipo" },
        created_at: new Date().toISOString(),
        profile: { nombre: "Mara", avatar: "🦊" },
      },
      {
        id: "2",
        group_id: "group-1",
        user_id: "otro",
        tipo: "score",
        contenido: { pts: 120, secs: 23, top: true },
        created_at: new Date().toISOString(),
        profile: { nombre: "Mara", avatar: "🦊" },
      },
    ];

    renderChatTab();

    await waitFor(() => expect(screen.getByText("hola equipo")).toBeInTheDocument());
    expect(screen.getByText(/Mara hizo 120 puntos/)).toBeInTheDocument();
    expect(screen.getByText(/⏱23s/)).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("enviar un mensaje llama a insert con tipo='text' y el texto tal cual", async () => {
    renderChatTab();
    const user = userEvent.setup();

    const input = await screen.findByPlaceholderText("Tu mensaje…");
    await user.type(input, "buenas");
    await user.click(screen.getByRole("button", { name: "↑" }));

    await waitFor(() => expect(insertedRows).toHaveLength(1));
    expect(insertedRows[0]).toMatchObject({
      group_id: "group-1",
      user_id: "me",
      tipo: "text",
      contenido: { texto: "buenas" },
    });
  });

  it("un INSERT de Realtime simulado dispara un refetch que muestra el mensaje nuevo", async () => {
    renderChatTab();

    await waitFor(() => expect(realtimeCallback).not.toBeNull());
    expect(await screen.findByText("Todavía no hay mensajes. Di algo 👋")).toBeInTheDocument();

    // Simula que llegó una fila nueva: el hook debe invalidar y refetchear la lista.
    mockMessages = [
      {
        id: "3",
        group_id: "group-1",
        user_id: "otro",
        tipo: "text",
        contenido: { texto: "recién llegado" },
        created_at: new Date().toISOString(),
        profile: { nombre: "Bruno", avatar: "🐻" },
      },
    ];
    realtimeCallback?.();

    await waitFor(() => expect(screen.getByText("recién llegado")).toBeInTheDocument());
  });
});
