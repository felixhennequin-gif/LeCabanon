import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  category: z.string().min(1, "Catégorie requise"),
});

export async function createEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEquipmentSchema.parse(req.body);
    const { communityId } = req.params;

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        ownerId: req.userId!,
        communityId,
      },
      include: { owner: { select: { id: true, firstName: true, lastName: true, photo: true } } },
    });
    res.status(201).json(equipment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
}

export async function listEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const { communityId } = req.params;
    const { category } = req.query;

    const where: Record<string, unknown> = { communityId };
    if (category) where.category = category;

    const equipment = await prisma.equipment.findMany({
      where,
      include: { owner: { select: { id: true, firstName: true, lastName: true, photo: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(equipment);
  } catch (err) {
    next(err);
  }
}

export async function getEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, firstName: true, lastName: true, photo: true } } },
    });
    if (!equipment) throw new AppError(404, "Matériel introuvable");
    res.json(equipment);
  } catch (err) {
    next(err);
  }
}

export async function updateEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const equipment = await prisma.equipment.findUnique({ where: { id: req.params.id } });
    if (!equipment) throw new AppError(404, "Matériel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    const updated = await prisma.equipment.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const equipment = await prisma.equipment.findUnique({ where: { id: req.params.id } });
    if (!equipment) throw new AppError(404, "Matériel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    await prisma.equipment.delete({ where: { id: req.params.id } });
    res.json({ message: "Matériel supprimé" });
  } catch (err) {
    next(err);
  }
}
