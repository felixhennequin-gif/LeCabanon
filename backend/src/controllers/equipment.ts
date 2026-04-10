import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { createActivity } from "../services/activity.js";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  category: z.string().min(1, "Catégorie requise"),
});

export async function createEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEquipmentSchema.parse(req.body);
    const communityId = req.params.communityId as string;

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

    createActivity({ type: "EQUIPMENT_ADDED", communityId, actorId: req.userId!, equipmentId: equipment.id });

    res.status(201).json(equipment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function listEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const communityId = req.params.communityId as string;
    const category = req.query.category as string | undefined;
    const ownerId = req.query.ownerId as string | undefined;

    const where: Record<string, unknown> = { communityId };
    if (category) where.category = category;
    if (ownerId) where.ownerId = ownerId;

    const [equipment, owners] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { owner: { select: { id: true, firstName: true, lastName: true, photo: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.equipment.findMany({
        where: { communityId },
        select: { owner: { select: { id: true, firstName: true, lastName: true } } },
        distinct: ["ownerId"],
      }),
    ]);

    res.json({
      equipment,
      owners: owners.map((e) => e.owner),
    });
  } catch (err) {
    next(err);
  }
}

export async function getEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
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
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError(404, "Matériel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    const updated = await prisma.equipment.update({
      where: { id },
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
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError(404, "Matériel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorisé");
    }

    createActivity({ type: "EQUIPMENT_REMOVED", communityId: equipment.communityId, actorId: req.userId!, equipmentId: equipment.id });

    await prisma.equipment.delete({ where: { id } });
    res.json({ message: "Matériel supprimé" });
  } catch (err) {
    next(err);
  }
}
