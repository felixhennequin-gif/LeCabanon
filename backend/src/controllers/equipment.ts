import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { createActivity } from "../services/activity.js";
import { processAndSaveImage, deleteImage } from "../utils/image.js";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  category: z.string().min(1, "Categorie requise"),
});

const includePhotos = { photos: { orderBy: { order: "asc" as const } } };

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
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, photo: true } },
        ...includePhotos,
      },
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
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, photo: true } },
          ...includePhotos,
        },
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
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, photo: true } },
        ...includePhotos,
      },
    });
    if (!equipment) throw new AppError(404, "Materiel introuvable");
    res.json(equipment);
  } catch (err) {
    next(err);
  }
}

export async function updateEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError(404, "Materiel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorise");
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
      },
      include: includePhotos,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: includePhotos,
    });
    if (!equipment) throw new AppError(404, "Materiel introuvable");
    if (equipment.ownerId !== req.userId && req.communityRole !== "ADMIN") {
      throw new AppError(403, "Non autorise");
    }

    createActivity({ type: "EQUIPMENT_REMOVED", communityId: equipment.communityId, actorId: req.userId!, equipmentId: equipment.id });

    // Delete photo files
    for (const photo of equipment.photos) {
      await deleteImage(photo.url);
    }

    await prisma.equipment.delete({ where: { id } });
    res.json({ message: "Materiel supprime" });
  } catch (err) {
    next(err);
  }
}

export async function uploadEquipmentPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { _count: { select: { photos: true } } },
    });
    if (!equipment) throw new AppError(404, "Materiel introuvable");
    if (equipment.ownerId !== req.userId) {
      throw new AppError(403, "Non autorise");
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Aucun fichier fourni" });
      return;
    }

    const currentCount = equipment._count.photos;
    if (currentCount + files.length > 5) {
      res.status(400).json({ error: "Maximum 5 photos par materiel" });
      return;
    }

    const photos = [];
    for (let i = 0; i < files.length; i++) {
      const url = await processAndSaveImage({
        buffer: files[i].buffer,
        folder: "equipment",
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 80,
      });
      const photo = await prisma.equipmentPhoto.create({
        data: {
          url,
          order: currentCount + i,
          equipmentId: id,
        },
      });
      photos.push(photo);
    }

    res.status(201).json(photos);
  } catch (err) {
    next(err);
  }
}

export async function deleteEquipmentPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const photoId = req.params.photoId as string;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError(404, "Materiel introuvable");
    if (equipment.ownerId !== req.userId) {
      throw new AppError(403, "Non autorise");
    }

    const photo = await prisma.equipmentPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.equipmentId !== id) {
      throw new AppError(404, "Photo introuvable");
    }

    await deleteImage(photo.url);
    await prisma.equipmentPhoto.delete({ where: { id: photoId } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
