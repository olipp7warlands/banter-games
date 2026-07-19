import { describe, expect, it } from "vitest";
import { buildMathQuestions } from "./math.mjs";

function evalQuestion(q) {
  const [aStr, sym, bStr] = q.q.split(" ");
  const a = Number(aStr);
  const b = Number(bStr);
  const fn = sym === "+" ? (x, y) => x + y : sym === "−" ? (x, y) => x - y : (x, y) => x * y;
  return fn(a, b);
}

describe("buildMathQuestions", () => {
  it("es determinista para la misma seed (misma partida para todo el grupo)", () => {
    expect(buildMathQuestions(42)).toEqual(buildMathQuestions(42));
  });

  it("seeds distintas dan tandas de preguntas distintas", () => {
    expect(buildMathQuestions(1)).not.toEqual(buildMathQuestions(2));
  });

  it("cada pregunta tiene 4 opciones únicas no negativas y la opción marcada es la respuesta correcta", () => {
    for (const q of buildMathQuestions(7, 20)) {
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts).size).toBe(4);
      expect(q.opts.every((o) => Number(o) >= 0)).toBe(true);
      expect(Number(q.opts[q.a])).toBe(evalQuestion(q));
    }
  });

  it("la resta nunca da un resultado negativo", () => {
    for (const q of buildMathQuestions(99, 30)) {
      if (q.q.includes("−")) expect(evalQuestion(q)).toBeGreaterThanOrEqual(0);
    }
  });

  it("respeta el count pedido", () => {
    expect(buildMathQuestions(5, 8)).toHaveLength(8);
  });
});
