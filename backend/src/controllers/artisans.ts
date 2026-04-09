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
  website: z.string().url().optional().or(z.literal("")),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  visibility: z.enum(["PUBLIC", "COMMUNITY"]).default("PUBLIC"),
  communityId: z.string().min(1, "communityId requis"),
});

export async function createArtisan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createArtisanSchema.parse(req.body);
    const communityId = req.params.communityId as string;
    const email = data.email || null;

    // If email is provided, check if artisan already exists globally
    if (email) {
      const existing = await prisma.artisan.findUnique({ where: { email } });
      if (existing) {
        // Check if already in this community
        const alreadyInCommunity = await prisma.artisanCommunity.findUnique({
          where: { artisanId_communityId: { artisanId: existing.id, communityId } },
        });
        if (alreadyInCommunity) {
          throw new AppError(409, "Cet artisan est déjà recommandé dans cette communauté");
        }
        // Add to this community
        await prisma.artisanCommunity.create({
          data: { artisanId: existing.id, communityId, addedById: req.userId! },
        });
        createActivity({ type: "ARTISAN_ADDED", communityId, actorId: req.userId!, artisanId: existing.id });
        res.status(201).json(existing);
        return;
      }
    }

    // Create new artisan + link to community
    const artisan = await prisma.artisan.create({
      data: {
        name: data.name,
        company: data.company,
        category: data.category,
        zone: data.zone,
        phone: data.phone,
        email,
        website: data.website || null,
        createdById: req.userId!,
        communities: {
          create: { communityId, addedById: req.userId! },
        },
      },
    });

    createActivity({ type: "ARTISAN_ADDED", communityId, actorId: req.userId!, artisanId: artisan.id });

    res.status(201).json(artisan);
  } catch (err) {
    if (err instanceof AppError) throw err;
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

    const where: Record<string, unknown> = {
      communities: { some: { communityId } },
    };
    if (category) where.category = category;

    const artisans = await prisma.artisan.findMany({
      where,
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

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
        owner: { select: { id: true, firstName: true, lastName: true } },
        communities: {
          include: { community: { select: { id: true, name: true } } },
        },
        reviews: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, photo: true } },
            media: true,
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true } },
              },
            },
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

    // Check which communities the user is a member of
    const userCommunityIds = artisan.communities.map((ac) => ac.communityId);
    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.userId!, communityId: { in: userCommunityIds } },
      select: { communityId: true },
    });
    const memberCommunityIds = new Set(memberships.map((m) => m.communityId));
    const isMemberOfAnyCommunity = memberCommunityIds.size > 0;

    // Filter reviews by visibility
    const filteredReviews = artisan.reviews.filter(
      (r) => r.visibility === "PUBLIC" || isMemberOfAnyCommunity || r.authorId === req.userId,
    );

    res.json({ ...artisan, reviews: filteredReviews, avgRating: avg._avg.rating });
  } catch (err) {
    next(err);
  }
}

export async function getArtisanPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { visibility: "PUBLIC" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            media: true,
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!artisan) throw new AppError(404, "Artisan introuvable");

    // Average rating on ALL reviews (public + community) for honesty
    const avg = await prisma.review.aggregate({
      where: { artisanId: artisan.id },
      _avg: { rating: true },
    });

    res.json({
      id: artisan.id,
      name: artisan.name,
      company: artisan.company,
      category: artisan.category,
      zone: artisan.zone,
      website: artisan.website,
      description: artisan.description,
      certifications: artisan.certifications,
      horaires: artisan.horaires,
      ownPhotos: artisan.ownPhotos,
      claimed: artisan.claimed,
      avgRating: avg._avg.rating,
      totalReviews: artisan._count.reviews,
      reviews: artisan.reviews,
    });
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
        website: req.body.website,
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
    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: { communities: true },
    });
    if (!artisan) throw new AppError(404, "Artisan introuvable");
    if (artisan.createdById !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    // Create activity for each community
    for (const ac of artisan.communities) {
      createActivity({ type: "ARTISAN_REMOVED", communityId: ac.communityId, actorId: req.userId!, artisanId: artisan.id });
    }

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

    createActivity({ type: "REVIEW_ADDED", communityId: data.communityId, actorId: req.userId!, artisanId: artisan.id, reviewId: review.id });

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
        replies: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if user is member of any artisan community
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      include: { communities: { select: { communityId: true } } },
    });
    const communityIds = artisan?.communities.map((ac) => ac.communityId) ?? [];
    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.userId!, communityId: { in: communityIds } },
      select: { communityId: true },
    });
    const isMember = memberships.length > 0;

    const filtered = reviews.filter(
      (r) => r.visibility === "PUBLIC" || isMember || r.authorId === req.userId,
    );
    res.json(filtered);
  } catch (err) {
    next(err);
  }
}
