import { color, font, radius } from "../theme";
import { useWallet } from "../hooks/useWallet";

// Píldora "🪙 N" — amarillo es el color de oro/monedas (CLAUDE.md).
export function WalletBadge() {
  const { data: monedas } = useWallet();
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontWeight: 700,
        fontSize: 14,
        padding: "6px 12px",
        borderRadius: radius,
        background: "rgba(244,194,13,0.16)",
        color: color.amarilloOscuro,
      }}
    >
      🪙 {monedas ?? 0}
    </span>
  );
}
