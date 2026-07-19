import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { color, font, radius } from "../theme";
import { usePacks, useBuyPack, type PackWithOwnership } from "../hooks/usePacks";
import { useWallet } from "../hooks/useWallet";
import { WalletBadge } from "../components/WalletBadge";
import { Toast } from "../components/Toast";
import { AppShell } from "../components/AppShell";

interface ToastState {
  message: string;
  variant: "success" | "error";
}

export function StorePage() {
  const navigate = useNavigate();
  const { data: packs, isLoading } = usePacks();
  const { data: monedas } = useWallet();
  const buyPack = useBuyPack();
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleBuy = (pack: PackWithOwnership) => {
    buyPack.mutate(pack.id, {
      onSuccess: () => setToast({ message: `¡${pack.nombre ?? pack.id} comprado! 🎉`, variant: "success" }),
      onError: (err) => setToast({ message: (err as Error).message, variant: "error" }),
    });
  };

  return (
    <AppShell>
      <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 15,
            color: color.tintaSuave,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Volver
        </button>
        <WalletBadge />
      </div>

      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, color: color.tinta, marginBottom: 6 }}>
        🎁 Packs temáticos
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, marginBottom: 18 }}>
        Cambian el look de tus juegos. Se compran con monedas ganadas jugando.
      </div>

      {isLoading && <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {packs?.map((pack) => (
          <PackRow
            key={pack.id}
            pack={pack}
            walletBalance={monedas ?? 0}
            onBuy={() => handleBuy(pack)}
            buying={buyPack.isPending}
          />
        ))}
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      </div>
    </AppShell>
  );
}

function PackRow({
  pack,
  walletBalance,
  onBuy,
  buying,
}: {
  pack: PackWithOwnership;
  walletBalance: number;
  onBuy: () => void;
  buying: boolean;
}) {
  const precio = pack.precio ?? 0;
  const faltan = Math.max(0, precio - walletBalance);
  const disabled = pack.owned || buying || faltan > 0;

  let label = "Comprar";
  if (pack.owned) label = "✓ Tuyo";
  else if (faltan > 0) label = `Te faltan ${faltan} 🪙`;
  else if (buying) label = "Comprando…";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 14,
        background: color.card,
        border: `1px solid ${color.linea}`,
        borderRadius: radius,
      }}
    >
      <div style={{ fontSize: 32, flex: "0 0 auto" }}>{pack.emoji ?? "🎨"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: color.tinta }}>
          {pack.nombre ?? pack.id}
        </div>
        <div style={{ fontFamily: font.mono, fontSize: 12, color: color.muted }}>💎 {precio} monedas</div>
      </div>
      <button
        onClick={onBuy}
        disabled={disabled}
        style={{
          flex: "0 0 auto",
          padding: "9px 16px",
          border: "none",
          borderRadius: radius,
          fontFamily: font.display,
          fontWeight: 800,
          fontSize: 13,
          cursor: disabled ? "default" : "pointer",
          background: pack.owned ? color.superficie : faltan > 0 ? color.superficieFuerte : color.rojo,
          color: pack.owned || faltan > 0 ? color.tintaSuave : color.blanco,
          opacity: disabled && !pack.owned && faltan === 0 ? 0.6 : 1,
        }}
      >
        {label}
      </button>
    </div>
  );
}
