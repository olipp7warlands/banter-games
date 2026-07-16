import { describe, expect, it } from "vitest";
import { mulberry32, buildQuestions } from "./shuffle.mjs";

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
