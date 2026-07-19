import { describe, expect, it } from "vitest";
import { buildStatements } from "./shuffle.mjs";
import { STATEMENTS } from "./statements.mjs";

describe("buildStatements", () => {
  it("es determinista para la misma seed", () => {
    expect(buildStatements(STATEMENTS, 42, 5)).toEqual(buildStatements(STATEMENTS, 42, 5));
  });

  it("seeds distintas dan tandas distintas", () => {
    expect(buildStatements(STATEMENTS, 1, 5)).not.toEqual(buildStatements(STATEMENTS, 2, 5));
  });

  it("no repite afirmaciones dentro de la misma tanda", () => {
    const picked = buildStatements(STATEMENTS, 7, 10);
    const unique = new Set(picked.map((s) => s.s));
    expect(unique.size).toBe(picked.length);
  });

  it("respeta el count pedido", () => {
    expect(buildStatements(STATEMENTS, 3, 8)).toHaveLength(8);
  });

  it("el banco tiene al menos 20 afirmaciones y una mezcla real de verdadero/falso", () => {
    expect(STATEMENTS.length).toBeGreaterThanOrEqual(20);
    const trues = STATEMENTS.filter((s) => s.a === true).length;
    const falses = STATEMENTS.length - trues;
    expect(trues).toBeGreaterThan(5);
    expect(falses).toBeGreaterThan(5);
  });
});
