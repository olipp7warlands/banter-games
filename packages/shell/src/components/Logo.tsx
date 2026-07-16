import { color, font } from "../theme";

// Identidad Banter: cuadrado rojo ■ + wordmark — consistente en login/onboarding/grupos.
export function Logo({ size = 28, textSize = 25 }: { size?: number; textSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: size, height: size, background: color.rojo, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: font.display,
          fontWeight: 800,
          fontSize: textSize,
          color: color.tinta,
          letterSpacing: -0.5,
        }}
      >
        Banter
      </span>
    </div>
  );
}
