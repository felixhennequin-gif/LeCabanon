import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

const createCommunitySchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
});

const joinCommunitySchema = z.object({
  accessCode: z.string().min(1, "Code d'accès requis"),
});

function generateAccessCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function createCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createCommunitySchema.parse(req.body);
    const community = await prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        accessCode: generateAccessCode(),
        createdById: req.userId!,
        members: {
          create: {
            userId: req.userId!,
            role: "ADMIN",
          },
        },
      },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, photo: true } } } } },
    });
    res.status(201).json(community);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function joinCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const data = joinCommunitySchema.parse(req.body);
    const community = await prisma.community.findUnique({ where: { accessCode: data.accessCode } });
    if (!community) {
      throw new AppError(404, "Communauté introuvable avec ce code");
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: community.id } },
    });
    if (existingMember) {
      throw new AppError(409, "Vous êtes déjà membre de cette communauté");
    }

    await prisma.communityMember.create({
      data: { userId: req.userId!, communityId: community.id, role: "MEMBER" },
    });

    res.json(community);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function getMyCommunities(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.userId! },
      include: {
        community: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });
    const communities = memberships.map((m) => ({
      ...m.community,
      role: m.role,
      memberCount: m.community._count.members,
    }));
    res.json(communities);
  } catch (err) {
    next(err);
  }
}

export async function getCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    // Verify membership
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: id } },
    });
    if (!membership) {
      throw new AppError(403, "Vous n'êtes pas membre de cette communauté");
    }

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, photo: true } } },
        },
        _count: { select: { members: true, equipment: true, artisans: true } },
      },
    });

    res.json({ ...community, role: membership.role });
  } catch (err) {
    next(err);
  }
}

export async function updateCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: id } },
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError(403, "Seul un admin peut modifier la communauté");
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.regenerateCode) updateData.accessCode = generateAccessCode();

    const community = await prisma.community.update({ where: { id }, data: updateData });
    res.json(community);
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const userId = req.params.userId as string;
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: id } },
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError(403, "Seul un admin peut retirer un membre");
    }
    if (userId === req.userId) {
      throw new AppError(400, "Vous ne pouvez pas vous retirer vous-même");
    }

    await prisma.communityMember.delete({
      where: { userId_communityId: { userId, communityId: id } },
    });
    res.json({ message: "Membre retiré" });
  } catch (err) {
    next(err);
  }
}
