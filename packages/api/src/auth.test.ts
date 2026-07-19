import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: { auth: { getUser } },
}));

import { requireUser, type AuthedRequest } from "./auth";

function buildApp() {
  const app = express();
  app.get("/protegido", requireUser, (req, res) => {
    res.json({ userId: (req as AuthedRequest).userId });
  });
  return app;
}

describe("requireUser", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("responde 401 sin header Authorization", async () => {
    const res = await request(buildApp()).get("/protegido");
    expect(res.status).toBe(401);
  });

  it("responde 401 con token inválido", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await request(buildApp()).get("/protegido").set("Authorization", "Bearer malo");
    expect(res.status).toBe(401);
  });

  it("adjunta userId y sigue con token válido", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await request(buildApp()).get("/protegido").set("Authorization", "Bearer bueno");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: "user-1" });
  });
});
