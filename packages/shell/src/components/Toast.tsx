import { useEffect } from "react";
import { color, font, radius } from "../theme";

interface Props {
  message: string;
  variant?: "success" | "error";
  onDismiss: () => void;
  durationMs?: number;
}

// Toast Bauhaus: fondo tinta, radius 0, franja de acento azul/rojo. Reutilizable — hoy solo
// lo usa la tienda, pero cualquier acción con éxito/error de servidor puede engancharlo.
export function Toast({ message, variant = "success", onDismiss, durationMs = 2600 }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: color.tinta,
        color: color.blanco,
        borderRadius: radius,
        borderLeft: `4px solid ${variant === "error" ? color.rojo : color.azul}`,
        padding: "12px 20px",
        fontFamily: font.display,
        fontWeight: 700,
        fontSize: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        maxWidth: "min(90vw, 420px)",
        textAlign: "center",
        zIndex: 80,
      }}
    >
      {message}
    </div>
  );
}
