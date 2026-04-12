import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

const SITE_ADMIN_EMAILS = (process.env.SITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireSiteAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true },
  });

  if (!user || !SITE_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: "Accès réservé aux administrateurs du site" });
    return;
  }

  next();
}
