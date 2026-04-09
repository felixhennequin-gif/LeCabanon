import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

declare global {
  namespace Express {
    interface Request {
      communityRole?: string;
    }
  }
}

export function requireMember(communityIdParam = "communityId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const communityId = req.params[communityIdParam] as string;
      if (!communityId) {
        res.status(400).json({ error: "communityId manquant" });
        return;
      }

      const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: req.userId!, communityId } },
      });

      if (!membership) {
        res.status(403).json({ error: "Vous n'êtes pas membre de cette communauté" });
        return;
      }

      req.communityRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
