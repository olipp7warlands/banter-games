import { useState, type CSSProperties } from "react";
import { color, font, radius } from "../theme";
import { CATEGORY_META, CATEGORIAS_CON_JUEGO } from "../lib/categories";
import type { Categoria, Group } from "../types/db";
import { useCreateGroup } from "../hooks/useGroups";
import { PrimaryButton } from "./PrimaryButton";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Categoria[];

interface Props {
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export function CreateGroupModal({ onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("cultura");
  const createGroup = useCreateGroup();

  const submit = async () => {
    if (!nombre.trim()) return;
    const group = await createGroup.mutateAsync({ nombre: nombre.trim(), categoria });
    onCreated(group);
  };

  return (
    <div style={overlayStyle}>
      <div style={sheetStyle}>
        <h2 style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color.tinta, margin: "0 0 14px" }}>
          Nuevo grupo
        </h2>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del grupo"
          style={inputStyle}
        />
        <div style={{ fontFamily: font.body, fontSize: 13, color: color.tintaSuave, margin: "14px 0 8px" }}>
          Categoría
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {ALL_CATEGORIES.map((cat) => {
            const disponible = CATEGORIAS_CON_JUEGO.includes(cat);
            const meta = CATEGORY_META[cat];
            const selected = categoria === cat;
            return (
              <button
                key={cat}
                disabled={!disponible}
                onClick={() => setCategoria(cat)}
                style={{
                  padding: "12px 8px",
                  borderRadius: radius,
                  border: `1.5px solid ${selected ? color.azul : color.linea}`,
                  background: selected ? color.azulTinte : color.card,
                  opacity: disponible ? 1 : 0.4,
                  cursor: disponible ? "pointer" : "not-allowed",
                  fontFamily: font.display,
                  fontWeight: 700,
                  fontSize: 14,
                  color: color.tinta,
                  textAlign: "left",
                }}
              >
                {meta.emoji} {meta.nombre}
                {!disponible && (
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: color.muted, marginTop: 2 }}>Pronto</div>
                )}
              </button>
            );
          })}
        </div>
        <PrimaryButton onClick={submit} disabled={!nombre.trim() || createGroup.isPending}>
          {createGroup.isPending ? "Creando…" : "Crear grupo"}
        </PrimaryButton>
        <button onClick={onClose} style={cancelStyle}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: color.velo,
  display: "grid",
  placeItems: "end center",
  zIndex: 50,
};
const sheetStyle: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: color.fondo,
  padding: 20,
  borderRadius: radius,
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: radius,
  border: `1.5px solid ${color.linea}`,
  fontFamily: font.body,
  fontSize: 15,
  boxSizing: "border-box",
};
const cancelStyle: CSSProperties = {
  display: "block",
  margin: "10px auto 0",
  background: "none",
  border: "none",
  color: color.tintaSuave,
  fontFamily: font.body,
  fontSize: 14,
  cursor: "pointer",
};
