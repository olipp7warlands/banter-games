import type { ButtonHTMLAttributes } from "react";
import { color, font, radius } from "../theme";

type Variant = "azul" | "rojo" | "amarillo";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const BG: Record<Variant, string> = { azul: color.azul, rojo: color.rojo, amarillo: color.amarillo };
const BG_OSCURO: Record<Variant, string> = {
  azul: color.azulOscuro,
  rojo: color.rojoOscuro,
  amarillo: color.amarilloOscuro,
};

export function PrimaryButton({ variant = "azul", style, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "15px 0",
        border: "none",
        borderRadius: radius,
        fontFamily: font.display,
        fontWeight: 800,
        fontSize: 17,
        color: variant === "amarillo" ? color.tinta : color.blanco,
        background: disabled ? color.superficieFuerte : BG[variant],
        boxShadow: disabled ? "none" : `0 4px 0 ${BG_OSCURO[variant]}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
