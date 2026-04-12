import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
});

export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const data = contactSchema.parse(req.body);

    await prisma.contactMessage.create({ data });
    console.log(`[Contact] Nouveau message de ${data.name} (${data.email})`);

    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

export async function listContactMessages(_req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function markContactMessageRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message) {
      throw new AppError(404, "Message introuvable");
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { readAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
