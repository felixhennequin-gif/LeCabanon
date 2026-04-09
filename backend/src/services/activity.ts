import { prisma } from "../utils/prisma.js";
import type { ActivityType } from "../../generated/prisma/client.js";

export function createActivity(params: {
  type: ActivityType;
  communityId: string;
  actorId: string;
  equipmentId?: string;
  artisanId?: string;
  reviewId?: string;
}): void {
  prisma.activity.create({ data: params }).catch((err) => {
    console.error("Failed to create activity:", err);
  });
}
