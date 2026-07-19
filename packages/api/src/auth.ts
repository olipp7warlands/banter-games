import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "./supabaseAdmin";

export interface AuthedRequest extends Request {
  userId: string;
}

// Verifica el access_token del shell contra Supabase Auth y adjunta el user_id verificado.
// Ningún endpoint debe leer userId del body: siempre de aquí, para que nadie pueda operar
// en nombre de otro usuario falsificando el payload.
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ error: "Falta el header Authorization: Bearer <token>" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Token inválido o caducado" });
    return;
  }

  (req as AuthedRequest).userId = data.user.id;
  next();
}
