import { color, font, radius } from "../theme";

interface Props {
  remaining: number;
  max?: number;
  // "overlay": sobre un fondo saturado (p.ej. la carta HOY con split diagonal) —
  // scrim oscuro + texto blanco en vez del tinte sutil por defecto.
  variant?: "default" | "overlay";
}

export function AttemptsBadge({ remaining, max = 2, variant = "default" }: Props) {
  const overlay = variant === "overlay";
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 13,
        padding: "4px 10px",
        borderRadius: radius,
        background: overlay ? color.scrim : color.superficie,
        color: overlay ? color.blanco : color.tintaSuave,
      }}
    >
      {remaining}/{max} intentos
    </span>
  );
}
