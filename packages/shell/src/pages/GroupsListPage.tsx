import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { color, font, radius } from "../theme";
import { useMyGroups } from "../hooks/useGroups";
import { CategoryBadge } from "../components/CategoryBadge";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { PrimaryButton } from "../components/PrimaryButton";
import { WalletBadge } from "../components/WalletBadge";
import { RewardBox } from "../components/RewardBox";
import { AppShell } from "../components/AppShell";

export function GroupsListPage() {
  const { data: groups, isLoading } = useMyGroups();
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  return (
    <AppShell>
      <div style={{ padding: 20 }}>
      {/* Packs/monedas son de cuenta, no por grupo: cabecera del home, no de cada grupo. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <WalletBadge />
        <RewardBox />
        <button
          onClick={() => navigate("/store")}
          style={{
            marginLeft: "auto",
            background: "none",
            border: `1px solid ${color.linea}`,
            borderRadius: radius,
            padding: "7px 12px",
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 13,
            color: color.tinta,
            cursor: "pointer",
          }}
        >
          🎁 Tienda
        </button>
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 26, color: color.tinta, marginBottom: 18 }}>
        Tus grupos
      </div>

      {isLoading && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>}

      {!isLoading && groups?.length === 0 && (
        <div style={{ fontFamily: font.body, color: color.tintaSuave, marginBottom: 20 }}>
          Todavía no tienes grupos. Crea uno o únete con un código de invitación.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {groups?.map((g) => (
          <button
            key={g.id}
            onClick={() => navigate(`/groups/${g.id}`)}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: radius,
              border: `1px solid ${color.linea}`,
              background: color.card,
              cursor: "pointer",
            }}
          >
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: color.tinta, marginBottom: 6 }}>
              {g.nombre}
            </div>
            <CategoryBadge categoria={g.categoria} />
          </button>
        ))}
      </div>

      <PrimaryButton onClick={() => setShowCreate(true)}>+ Nuevo grupo</PrimaryButton>
      <button
        onClick={() => navigate("/join")}
        style={{
          display: "block",
          margin: "12px auto 0",
          background: "none",
          border: "none",
          color: color.azul,
          fontFamily: font.body,
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Únete con un código
      </button>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => {
            setShowCreate(false);
            navigate(`/groups/${g.id}`);
          }}
        />
      )}
      </div>
    </AppShell>
  );
}
