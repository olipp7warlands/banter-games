import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => from(...args) },
}));

import { getPar } from "./manifest";

describe("getPar", () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    eq.mockClear();
    maybeSingle.mockReset();
  });

  it("consulta la tabla games por id y devuelve su par", async () => {
    maybeSingle.mockResolvedValue({ data: { par: 50 }, error: null });
    const par = await getPar("trivia");
    expect(par).toBe(50);
    expect(from).toHaveBeenCalledWith("games");
    expect(select).toHaveBeenCalledWith("par");
    expect(eq).toHaveBeenCalledWith("id", "trivia");
  });

  it("devuelve null si el juego no existe", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getPar("no-existe")).toBeNull();
  });

  it("devuelve null si el juego existe pero su par es null (endless)", async () => {
    maybeSingle.mockResolvedValue({ data: { par: null }, error: null });
    expect(await getPar("merge")).toBeNull();
  });

  it("lanza si Supabase devuelve error", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(getPar("trivia")).rejects.toThrow("boom");
  });
});
