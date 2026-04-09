import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
