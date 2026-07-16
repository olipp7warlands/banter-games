import { color, font, radius } from "../theme";
import { CATEGORY_META } from "../lib/categories";
import type { Categoria } from "../types/db";

export function CategoryBadge({ categoria }: { categoria: Categoria }) {
  const meta = CATEGORY_META[categoria];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: radius,
        background: color.superficie,
        fontFamily: font.body,
        fontWeight: 600,
        fontSize: 13,
        color: color.tinta,
      }}
    >
      <span>{meta.emoji}</span>
      {meta.nombre}
    </span>
  );
}
