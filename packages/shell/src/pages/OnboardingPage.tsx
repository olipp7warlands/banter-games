import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { color, font, radius } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { Logo } from "../components/Logo";
import { AppShell } from "../components/AppShell";
import { useCreateProfile } from "../hooks/useProfile";

const AVATARS = ["⭐", "🦊", "🐼", "🐧", "🦉", "🐙", "🦁", "🐢", "🦄", "🐝", "🦋", "🐳"];

export function OnboardingPage() {
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0] ?? "⭐");
  const createProfile = useCreateProfile();
  const navigate = useNavigate();

  const submit = async () => {
    if (!nombre.trim()) return;
    await createProfile.mutateAsync({ nombre: nombre.trim(), avatar });
    navigate("/groups", { replace: true });
  };

  return (
    <AppShell>
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo size={26} textSize={22} />
        </div>
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 800,
            fontSize: 24,
            color: color.tinta,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          ¿Cómo te llamamos?
        </div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: radius,
            border: `1.5px solid ${color.linea}`,
            fontFamily: font.body,
            fontSize: 15,
            boxSizing: "border-box",
            marginBottom: 18,
          }}
        />
        <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 8 }}>
          Elige un avatar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 24 }}>
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              style={{
                fontSize: 22,
                padding: "10px 0",
                borderRadius: radius,
                border: `1.5px solid ${avatar === a ? color.azul : color.linea}`,
                background: avatar === a ? color.azulTinte : color.card,
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <PrimaryButton onClick={submit} disabled={!nombre.trim() || createProfile.isPending}>
          {createProfile.isPending ? "Guardando…" : "Empezar"}
        </PrimaryButton>
      </div>
    </AppShell>
  );
}
