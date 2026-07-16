import { describe, expect, it } from "vitest";
import { mulberry32, buildQuestions } from "./shuffle.mjs";
import { QUESTIONS as BANK } from "./questions.mjs";

const QUESTIONS = [
  { q: "¿Capital de Francia?", opts: ["Roma", "París", "Berlín", "Madrid"], a: 1 },
  { q: "¿Cuántos días tiene una semana?", opts: ["5", "6", "7", "8"], a: 2 },
  { q: "¿Cuál es el planeta rojo?", opts: ["Venus", "Marte", "Júpiter", "Saturno"], a: 1 },
];

describe("mulberry32", () => {
  it("es determinista: misma seed -> misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("buildQuestions", () => {
  it("misma seed -> mismo orden de preguntas y opciones", () => {
    expect(buildQuestions(QUESTIONS, 7)).toEqual(buildQuestions(QUESTIONS, 7));
  });

  it("la opción correcta sigue apuntando al texto correcto tras barajar", () => {
    const built = buildQuestions(QUESTIONS, 123);
    built.forEach((q, i) => {
      const original = QUESTIONS.find((orig) => orig.q === q.q);
      expect(q.opts[q.a]).toBe(original.opts[original.a]);
    });
  });
});

describe("buildQuestions sobre el banco real (66 preguntas, reto diario)", () => {
  it("elige exactamente 5 preguntas sin repetir", () => {
    const built = buildQuestions(BANK, 2026071601, 5);
    expect(built).toHaveLength(5);
    expect(new Set(built.map((q) => q.q)).size).toBe(5);
  });

  it("misma seed -> las mismas 5 preguntas (mismo orden) dos veces", () => {
    const a = buildQuestions(BANK, 2026071601, 5);
    const b = buildQuestions(BANK, 2026071601, 5);
    expect(a).toEqual(b);
  });

  it("seeds distintas -> selecciones distintas", () => {
    const a = buildQuestions(BANK, 1, 5).map((q) => q.q);
    const b = buildQuestions(BANK, 2, 5).map((q) => q.q);
    expect(a).not.toEqual(b);
  });

  it("cada opción correcta remapeada sigue siendo el texto correcto original", () => {
    const built = buildQuestions(BANK, 555, 5);
    built.forEach((q) => {
      const original = BANK.find((orig) => orig.q === q.q);
      expect(q.opts[q.a]).toBe(original.opts[original.a]);
    });
  });
});
