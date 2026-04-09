import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { prisma } from "../utils/prisma.js";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const userRouter = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

userRouter.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, firstName: true, lastName: true, photo: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

userRouter.patch("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, photo: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});
