import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

export async function listPages(_req: Request, res: Response, next: NextFunction) {
  try {
    const pages = await prisma.sitePage.findMany({
      select: { id: true, slug: true, title: true, updatedAt: true },
      orderBy: { slug: "asc" },
    });
    res.json(pages);
  } catch (err) {
    next(err);
  }
}

export async function getPageBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const page = await prisma.sitePage.findUnique({
      where: { slug },
    });
    if (!page) {
      throw new AppError(404, "Page introuvable");
    }
    res.json(page);
  } catch (err) {
    next(err);
  }
}

const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
});

export async function updatePage(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const data = updatePageSchema.parse(req.body);

    const existing = await prisma.sitePage.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new AppError(404, "Page introuvable");
    }

    const page = await prisma.sitePage.update({
      where: { slug },
      data,
    });
    res.json(page);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}
