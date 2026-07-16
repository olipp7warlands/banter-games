import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { color, font, radius } from "../theme";
import { useGroupLookup, useJoinGroup } from "../hooks/useGroups";
import { CategoryBadge } from "../components/CategoryBadge";
import { PrimaryButton } from "../components/PrimaryButton";

export function JoinGroupPage() {
  const { code: codeParam } = useParams<{ code?: string }>();
  const [codeInput, setCodeInput] = useState(codeParam ?? "");
  const [lookupCode, setLookupCode] = useState(codeParam);
  const { data: group, isLoading, isError } = useGroupLookup(lookupCode);
  const joinGroup = useJoinGroup();
  const navigate = useNavigate();

  const search = () => setLookupCode(codeInput.trim().toUpperCase());

  const join = async () => {
    if (!group) return;
    await joinGroup.mutateAsync({ groupId: group.id });
    navigate(`/groups/${group.id}`, { replace: true });
  };

  return (
    <div style={{ minHeight: "100dvh", background: color.fondo, padding: 24 }}>
      <div style={{ maxWidth: 360, margin: "0 auto" }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, marginBottom: 16 }}>
          Únete a un grupo
        </div>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="Código de invitación"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: radius,
            border: `1.5px solid ${color.linea}`,
            fontFamily: font.mono,
            fontSize: 16,
            textTransform: "uppercase",
            boxSizing: "border-box",
            marginBottom: 10,
          }}
        />
        <PrimaryButton onClick={search} disabled={!codeInput.trim()}>
          Buscar
        </PrimaryButton>

        {isLoading && lookupCode && (
          <div style={{ marginTop: 16, fontFamily: font.body, color: color.tintaSuave }}>Buscando…</div>
        )}
        {isError && (
          <div style={{ marginTop: 16, fontFamily: font.body, color: color.rojo }}>Error buscando el grupo.</div>
        )}
        {lookupCode && !isLoading && !isError && !group && (
          <div style={{ marginTop: 16, fontFamily: font.body, color: color.rojo }}>
            No existe ningún grupo con ese código.
          </div>
        )}

        {group && (
          <div
            style={{
              marginTop: 20,
              background: color.card,
              border: `1px solid ${color.linea}`,
              borderRadius: radius,
              padding: 18,
            }}
          >
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: color.tinta, marginBottom: 8 }}>
              {group.nombre}
            </div>
            <CategoryBadge categoria={group.categoria} />
            <div style={{ marginTop: 16 }}>
              <PrimaryButton onClick={join} disabled={joinGroup.isPending}>
                {joinGroup.isPending ? "Uniéndote…" : "Unirse"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
