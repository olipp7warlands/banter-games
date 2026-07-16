import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { color, font, radius } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";

// Google como opción primaria (evita salir a la app de correo en móvil, donde se
// pierden sesiones fácilmente en público 35-65); magic-link como alternativa secundaria.
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: color.fondo,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 360, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 32, color: color.tinta }}>Banter</div>
          <div style={{ fontFamily: font.body, fontSize: 14, color: color.tintaSuave, marginTop: 6 }}>
            Juegos diarios con tu círculo
          </div>
        </div>

        <button
          onClick={signInGoogle}
          style={{
            width: "100%",
            padding: "15px 0",
            border: `1.5px solid ${color.linea}`,
            borderRadius: radius,
            background: color.card,
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 16,
            color: color.tinta,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          Continuar con Google
        </button>

        <div
          style={{
            textAlign: "center",
            fontFamily: font.body,
            fontSize: 12,
            color: color.muted,
            margin: "18px 0 10px",
          }}
        >
          o con enlace mágico por email
        </div>

        {sent ? (
          <div style={{ textAlign: "center", fontFamily: font.body, fontSize: 14, color: color.tinta, padding: "10px 0" }}>
            Revisa tu correo — te hemos enviado un enlace para entrar.
          </div>
        ) : (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: radius,
                border: `1.5px solid ${color.linea}`,
                fontFamily: font.body,
                fontSize: 15,
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
            <PrimaryButton onClick={sendMagicLink} disabled={sending || !email.trim()}>
              {sending ? "Enviando…" : "Enviar enlace"}
            </PrimaryButton>
            {error && <div style={{ color: color.rojo, fontFamily: font.body, fontSize: 13, marginTop: 8 }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
