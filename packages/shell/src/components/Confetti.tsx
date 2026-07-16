import { useEffect, useState } from "react";
import { color } from "../theme";

const COLORS = [color.rojo, color.azul, color.amarillo];
const SHAPES = ["●", "■", "▲"];
const COUNT = 18;
const DURATION_MS = 2200;

// Confeti geométrico (●■▲, los 3 primarios) — un burst por cada vez que `burstKey`
// cambia (incrementar en el caller al detectar "quedé 1º hoy"). Traducido de la
// animación `fall` de prototype/banter.jsx, con @keyframes inyectado inline porque
// el shell no tiene hoja de estilos global (mismo patrón que usaba el prototipo).
export function Confetti({ burstKey }: { burstKey: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (burstKey === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [burstKey]);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
      <style>{`
        @keyframes banterConfettiFall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(380deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: COUNT }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 5.6) % 100}%`,
            top: -20,
            fontSize: 14 + (i % 3) * 6,
            color: COLORS[i % 3],
            animation: `banterConfettiFall ${1.6 + (i % 5) * 0.3}s ${(i % 7) * 0.12}s ease-in forwards`,
          }}
        >
          {SHAPES[i % 3]}
        </span>
      ))}
    </div>
  );
}
