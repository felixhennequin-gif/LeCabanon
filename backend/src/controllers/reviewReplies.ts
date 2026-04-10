import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

const replySchema = z.object({
  content: z.string().min(1, "Contenu requis").max(1000, "1000 caractères maximum"),
});

export async function createReply(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewId = req.params.reviewId as string;
    const data = replySchema.parse(req.body);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { artisan: { select: { id: true, ownerId: true } } },
    });
    if (!review) throw new AppError(404, "Avis introuvable");
    if (review.artisan.ownerId !== req.userId) {
      throw new AppError(403, "Seul le propriétaire de la fiche peut répondre aux avis");
    }

    // Check no existing reply
    const existing = await prisma.reviewReply.findFirst({ where: { reviewId } });
    if (existing) throw new AppError(409, "Vous avez déjà répondu à cet avis");

    const reply = await prisma.reviewReply.create({
      data: {
        content: data.content,
        reviewId,
        artisanId: review.artisan.id,
        authorId: req.userId!,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(reply);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function updateReply(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewId = req.params.reviewId as string;
    const data = replySchema.parse(req.body);

    const reply = await prisma.reviewReply.findFirst({
      where: { reviewId },
      include: { artisan: { select: { ownerId: true } } },
    });
    if (!reply) throw new AppError(404, "Réponse introuvable");
    if (reply.artisan.ownerId !== req.userId) {
      throw new AppError(403, "Non autorisé");
    }

    const updated = await prisma.reviewReply.update({
      where: { id: reply.id },
      data: { content: data.content },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
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
