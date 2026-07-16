import { color, font, radius } from "../theme";

export function AttemptsBadge({ remaining, max = 2 }: { remaining: number; max?: number }) {
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 13,
        padding: "4px 10px",
        borderRadius: radius,
        background: color.superficie,
        color: color.tintaSuave,
      }}
    >
      {remaining}/{max} intentos
    </span>
  );
}
