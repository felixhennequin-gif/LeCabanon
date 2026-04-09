import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { createActivity } from "../services/activity.js";

const createInvitationSchema = z.object({
  expiresIn: z.number().int().min(1).max(720),
  maxUses: z.number().int().min(1).optional(),
});

export async function createInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.id as string;
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError(403, "Seul un admin peut créer des invitations");
    }

    const data = createInvitationSchema.parse(req.body);
    const expiresAt = new Date(Date.now() + data.expiresIn * 3600_000);

    const invitation = await prisma.invitation.create({
      data: {
        communityId,
        createdById: req.userId!,
        expiresAt,
        maxUses: data.maxUses ?? null,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.status(201).json({
      id: invitation.id,
      token: invitation.token,
      url: `${frontendUrl}/invite/${invitation.token}`,
      expiresAt: invitation.expiresAt,
      maxUses: invitation.maxUses,
      uses: invitation.uses,
      active: invitation.active,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function listInvitations(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.id as string;
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError(403, "Seul un admin peut voir les invitations");
    }

    const invitations = await prisma.invitation.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    const now = new Date();
    const result = invitations.map((inv) => ({
      ...inv,
      expired: !inv.active || inv.expiresAt < now || (inv.maxUses !== null && inv.uses >= inv.maxUses),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function revokeInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.id as string;
    const invitationId = req.params.invitationId as string;
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError(403, "Seul un admin peut révoquer des invitations");
    }

    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.communityId !== communityId) {
      throw new AppError(404, "Invitation introuvable");
    }

    await prisma.invitation.update({ where: { id: invitationId }, data: { active: false } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getInviteInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        community: { select: { name: true, description: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) {
      throw new AppError(410, "Ce lien d'invitation n'existe pas");
    }

    const now = new Date();
    if (!invitation.active) {
      throw new AppError(410, "Ce lien d'invitation a été révoqué");
    }
    if (invitation.expiresAt < now) {
      throw new AppError(410, "Ce lien d'invitation a expiré");
    }
    if (invitation.maxUses !== null && invitation.uses >= invitation.maxUses) {
      throw new AppError(410, "Ce lien d'invitation a atteint son nombre maximum d'utilisations");
    }

    res.json({
      communityName: invitation.community.name,
      communityDescription: invitation.community.description,
      createdByName: `${invitation.createdBy.firstName} ${invitation.createdBy.lastName}`,
      expiresAt: invitation.expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function joinViaInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;
    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation) {
      throw new AppError(410, "Ce lien d'invitation n'existe pas");
    }

    const now = new Date();
    if (!invitation.active) {
      throw new AppError(410, "Ce lien d'invitation a été révoqué");
    }
    if (invitation.expiresAt < now) {
      throw new AppError(410, "Ce lien d'invitation a expiré");
    }
    if (invitation.maxUses !== null && invitation.uses >= invitation.maxUses) {
      throw new AppError(410, "Ce lien d'invitation a atteint son nombre maximum d'utilisations");
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: invitation.communityId } },
    });
    if (existingMember) {
      throw new AppError(409, "Vous êtes déjà membre de cette communauté");
    }

    await prisma.$transaction([
      prisma.communityMember.create({
        data: { userId: req.userId!, communityId: invitation.communityId, role: "MEMBER" },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { uses: { increment: 1 } },
      }),
    ]);

    createActivity({ type: "MEMBER_JOINED", communityId: invitation.communityId, actorId: req.userId! });

    res.json({ communityId: invitation.communityId });
  } catch (err) {
    next(err);
  }
}
