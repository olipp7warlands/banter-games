// Cliente fino para la API de M3 (packages/api): la escritura de economía (plays, wallets,
// packs, regalo diario) ya no la hace el shell directo contra Supabase, la hace esta API
// con service_role. Ver docs/ARQUITECTURA.md.
const API_URL = import.meta.env.VITE_API_URL;

interface CallApiOptions {
  method?: "GET" | "POST";
  body?: unknown;
  accessToken: string;
}

export async function callApi<T>(path: string, { method = "POST", body, accessToken }: CallApiOptions): Promise<T> {
  if (!API_URL) {
    throw new Error("Falta VITE_API_URL. Copia packages/shell/.env.example a .env.local y rellénala.");
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Error ${res.status} llamando a ${path}`);
  }
  return json as T;
}
