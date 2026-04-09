import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { prisma } from "../utils/prisma.js";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const userRouter = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

userRouter.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, firstName: true, lastName: true, photo: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

userRouter.patch("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, photo: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

userRouter.get("/:id/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.params.id as string;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, firstName: true, lastName: true, photo: true, createdAt: true },
    });
    if (!targetUser) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    // Get communities where both the viewer and the target are members
    const viewerMemberships = await prisma.communityMember.findMany({
      where: { userId: req.userId! },
      select: { communityId: true },
    });
    const viewerCommunityIds = viewerMemberships.map((m) => m.communityId);

    const equipment = await prisma.equipment.findMany({
      where: {
        ownerId: targetId,
        communityId: { in: viewerCommunityIds },
      },
      include: {
        community: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviews = await prisma.review.findMany({
      where: {
        authorId: targetId,
        visibility: "PUBLIC",
      },
      include: {
        artisan: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ...targetUser, equipment, reviews });
  } catch (err) {
    next(err);
  }
});
