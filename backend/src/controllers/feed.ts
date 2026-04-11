import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.communityId as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const activities = await prisma.activity.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, photo: true } },
        equipment: { select: { id: true, name: true, category: true, photos: { select: { id: true, url: true }, orderBy: { order: "asc" }, take: 1 } } },
        artisan: { select: { id: true, name: true, category: true, company: true } },
        review: { select: { id: true, rating: true, comment: true, artisan: { select: { id: true, name: true } } } },
      },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({ activities: items, nextCursor });
  } catch (err) {
    next(err);
  }
}
