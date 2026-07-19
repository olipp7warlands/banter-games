import { describe, expect, it } from "vitest";
import { buildWords } from "./shuffle.mjs";
import { WORDS } from "./words.mjs";

describe("buildWords", () => {
  it("es determinista para la misma seed", () => {
    expect(buildWords(WORDS, 42, 5)).toEqual(buildWords(WORDS, 42, 5));
  });

  it("seeds distintas dan tandas distintas", () => {
    expect(buildWords(WORDS, 1, 5)).not.toEqual(buildWords(WORDS, 2, 5));
  });

  it("no repite palabras dentro de la misma tanda", () => {
    const picked = buildWords(WORDS, 7, 10);
    const unique = new Set(picked.map((p) => p.word));
    expect(unique.size).toBe(picked.length);
  });

  it("respeta el count pedido", () => {
    expect(buildWords(WORDS, 3, 8)).toHaveLength(8);
  });

  it("letterOrder es una permutación válida de los índices de la palabra", () => {
    for (const { word, letterOrder } of buildWords(WORDS, 11, 24)) {
      expect(letterOrder.length).toBe(word.length);
      expect([...letterOrder].sort((a, b) => a - b)).toEqual(word.split("").map((_, i) => i));
    }
  });

  it("el banco tiene al menos 20 palabras, todas en mayúsculas sin espacios", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(20);
    expect(WORDS.every((w) => w === w.toUpperCase() && !w.includes(" "))).toBe(true);
  });
});
