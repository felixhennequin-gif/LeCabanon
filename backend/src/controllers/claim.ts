import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

export async function claimArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");

    if (!artisan.email) {
      throw new AppError(400, "Impossible de revendiquer cette fiche : aucun email renseigné");
    }
    if (artisan.claimed) {
      throw new AppError(409, "Cette fiche a déjà été revendiquée");
    }

    // Check if user already owns another artisan
    const existing = await prisma.artisan.findUnique({ where: { ownerId: req.userId! } });
    if (existing) {
      throw new AppError(409, "Vous avez déjà revendiqué une fiche artisan");
    }

    const token = crypto.randomUUID();
    await prisma.artisan.update({
      where: { id },
      data: { claimToken: token, claimRequestedById: req.userId! },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyLink = `${frontendUrl}/artisans/${id}/verify-claim?token=${token}`;

    // V1: log to console instead of sending real email
    console.log("\n========== CLAIM VERIFICATION EMAIL ==========");
    console.log(`To: ${artisan.email}`);
    console.log(`Subject: Revendiquez votre fiche sur LeCabanon`);
    console.log(`Link: ${verifyLink}`);
    console.log("===============================================\n");

    // Mask email for response
    const [local, domain] = artisan.email.split("@");
    const masked = `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`;

    res.json({ message: `Email de vérification envoyé à ${masked}` });
  } catch (err) {
    if (err instanceof AppError) throw err;
    next(err);
  }
}

const verifyClaimSchema = z.object({
  token: z.string().min(1, "Token requis"),
});

export async function verifyClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { token } = verifyClaimSchema.parse(req.body);

    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");
    if (artisan.claimed) throw new AppError(409, "Cette fiche a déjà été revendiquée");
    if (!artisan.claimToken || artisan.claimToken !== token) {
      throw new AppError(400, "Token de vérification invalide");
    }
    if (artisan.claimRequestedById !== req.userId) {
      throw new AppError(403, "Ce lien de vérification n'est pas associé à votre compte");
    }

    const updated = await prisma.artisan.update({
      where: { id },
      data: {
        claimed: true,
        claimedAt: new Date(),
        ownerId: req.userId!,
        claimToken: null,
        claimRequestedById: null,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

const updateProfileSchema = z.object({
  description: z.string().max(2000).optional(),
  certifications: z.array(z.string()).optional(),
  horaires: z.string().max(500).optional(),
  ownPhotos: z.array(z.string()).optional(),
});

export async function updateArtisanProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");
    if (artisan.ownerId !== req.userId) {
      throw new AppError(403, "Vous n'êtes pas le propriétaire de cette fiche");
    }

    const data = updateProfileSchema.parse(req.body);
    const updated = await prisma.artisan.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}
