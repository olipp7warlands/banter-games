import { useState, type CSSProperties } from "react";
import { color, duration, easing, font, radius } from "../theme";
import { useClaimGift, useDailyGiftStatus } from "../hooks/useDailyGift";

type Phase = "closed" | "shaking" | "revealing" | "claimed";

const SHAKE_MS = 600;
const REVEAL_MS = 700;
const BURST_COLORS = [color.rojo, color.azul, color.amarillo];
const BURST_SHAPES = ["●", "■", "▲"];
const BURST_COUNT = 10;

// Traducido de RewardBox/rollReward en prototype/banter.jsx: tap → sacudida → estallido de
// confeti ●■▲ → reveal del importe con pop. El sorteo real lo hace la API (POST
// /gift/claim) — aquí solo se anima la espera y se pinta el resultado que llega del server.
export function RewardBox() {
  const { data: alreadyClaimed, isLoading } = useDailyGiftStatus();
  const claimGift = useClaimGift();
  const [phase, setPhase] = useState<Phase>("closed");
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);

  const handleOpen = () => {
    if (isLoading || alreadyClaimed || phase !== "closed") return;
    setPhase("shaking");
    window.setTimeout(() => {
      claimGift.mutate(undefined, {
        onSuccess: (result) => {
          setRewardAmount(result.rewardAmount);
          setPhase("revealing");
          window.setTimeout(() => setPhase("claimed"), REVEAL_MS);
        },
        onError: () => setPhase("closed"),
      });
    }, SHAKE_MS);
  };

  const basePill: CSSProperties = {
    position: "relative",
    fontFamily: font.display,
    fontWeight: 800,
    fontSize: 13,
    padding: "8px 14px",
    borderRadius: radius,
    border: "none",
  };

  if (phase === "revealing" || phase === "claimed") {
    return (
      <span
        style={{
          ...basePill,
          background: "rgba(244,194,13,0.16)",
          color: color.amarilloOscuro,
          animation: phase === "revealing" ? `banterRewardPop ${duration.slow}ms ${easing} both` : undefined,
        }}
      >
        {phase === "revealing" && <BurstOverlay />}
        <style>{POP_KEYFRAMES}</style>
        🎉 +{rewardAmount} monedas
      </span>
    );
  }

  if (alreadyClaimed) {
    return (
      <span style={{ ...basePill, background: color.superficie, color: color.muted }}>🎁 Ya reclamado hoy</span>
    );
  }

  return (
    <button
      onClick={handleOpen}
      disabled={phase === "shaking"}
      style={{
        ...basePill,
        background: color.amarillo,
        color: color.tinta,
        cursor: phase === "shaking" ? "default" : "pointer",
        animation: phase === "shaking" ? `banterRewardShake ${SHAKE_MS}ms ease-in-out` : undefined,
      }}
    >
      <style>{SHAKE_KEYFRAMES}</style>
      {phase === "shaking" ? "Abriendo…" : "🎁 Regalo diario"}
    </button>
  );
}

// Fuera del componente: no hace falta recalcular en cada render, y usar Math.random() aquí
// (en vez de en un flujo de Workflow) es seguro — es UI de cliente en tiempo de ejecución.
function BurstOverlay() {
  const particles = Array.from({ length: BURST_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / BURST_COUNT + Math.random() * 0.4;
    const dist = 26 + Math.random() * 18;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: BURST_COLORS[i % BURST_COLORS.length],
      shape: BURST_SHAPES[i % BURST_SHAPES.length],
      delay: (i % 4) * 20,
    };
  });
  return (
    <span
      aria-hidden
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
    >
      <style>{BURST_KEYFRAMES}</style>
      {particles.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              left: "50%",
              top: "50%",
              fontSize: 12,
              color: p.color,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              animation: `banterRewardBurst ${REVEAL_MS - 100}ms ease-out ${p.delay}ms both`,
            } as CSSProperties
          }
        >
          {p.shape}
        </span>
      ))}
    </span>
  );
}

const SHAKE_KEYFRAMES = `
@keyframes banterRewardShake {
  0%, 100% { transform: translateX(0) rotate(0); }
  20% { transform: translateX(-6px) rotate(-3deg); }
  40% { transform: translateX(6px) rotate(3deg); }
  60% { transform: translateX(-4px) rotate(-2deg); }
  80% { transform: translateX(4px) rotate(2deg); }
}
`;

const BURST_KEYFRAMES = `
@keyframes banterRewardBurst {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.4) rotate(200deg); opacity: 0; }
}
`;

const POP_KEYFRAMES = `
@keyframes banterRewardPop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;
