import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { createActivity } from "../services/activity.js";

const createArtisanSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional(),
  category: z.string().min(1, "Catégorie requise"),
  zone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export async function createArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createArtisanSchema.parse(req.body);
    const communityId = req.params.communityId as string;

    const artisan = await prisma.artisan.create({
      data: {
        name: data.name,
        company: data.company,
        category: data.category,
        zone: data.zone,
        phone: data.phone,
        email: data.email || null,
        createdById: req.userId!,
        communityId,
      },
    });

    createActivity({ type: "ARTISAN_ADDED", communityId, actorId: req.userId!, artisanId: artisan.id });

    res.status(201).json(artisan);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function listArtisans(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.communityId as string;
    const category = req.query.category as string | undefined;

    const where: Record<string, unknown> = { communityId };
    if (category) where.category = category;

    const artisans = await prisma.artisan.findMany({
      where,
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute average rating
    const withRatings = await Promise.all(
      artisans.map(async (a) => {
        const avg = await prisma.review.aggregate({
          where: { artisanId: a.id },
          _avg: { rating: true },
        });
        return { ...a, avgRating: avg._avg.rating, reviewCount: a._count.reviews };
      }),
    );

    res.json(withRatings);
  } catch (err) {
    next(err);
  }
}

export async function getArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        reviews: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, photo: true } },
            media: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!artisan) throw new AppError(404, "Artisan introuvable");

    const avg = await prisma.review.aggregate({
      where: { artisanId: artisan.id },
      _avg: { rating: true },
    });

    // Filter private reviews: only author can see their own private reviews
    const filteredReviews = artisan.reviews.filter(
      (r) => r.visibility === "PUBLIC" || r.authorId === req.userId,
    );

    res.json({ ...artisan, reviews: filteredReviews, avgRating: avg._avg.rating });
  } catch (err) {
    next(err);
  }
}

export async function updateArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");
    if (artisan.createdById !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    const updated = await prisma.artisan.update({
      where: { id },
      data: {
        name: req.body.name,
        company: req.body.company,
        category: req.body.category,
        zone: req.body.zone,
        phone: req.body.phone,
        email: req.body.email,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");
    if (artisan.createdById !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    createActivity({ type: "ARTISAN_REMOVED", communityId: artisan.communityId, actorId: req.userId!, artisanId: artisan.id });

    await prisma.artisan.delete({ where: { id } });
    res.json({ message: "Artisan supprimé" });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = createReviewSchema.parse(req.body);
    const artisan = await prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new AppError(404, "Artisan introuvable");

    const review = await prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        visibility: data.visibility,
        artisanId: artisan.id,
        authorId: req.userId!,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, photo: true } },
      },
    });

    createActivity({ type: "REVIEW_ADDED", communityId: artisan.communityId, actorId: req.userId!, artisanId: artisan.id, reviewId: review.id });

    res.status(201).json(review);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const artisanId = req.params.id as string;
    const reviews = await prisma.review.findMany({
      where: { artisanId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, photo: true } },
        media: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const filtered = reviews.filter(
      (r) => r.visibility === "PUBLIC" || r.authorId === req.userId,
    );
    res.json(filtered);
  } catch (err) {
    next(err);
  }
}
