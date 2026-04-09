import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireMember } from "../middlewares/requireMember.js";
import {
  createEquipment,
  listEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipment.js";

export const equipmentRouter = Router();

equipmentRouter.use(authenticate);

// Community-scoped routes
equipmentRouter.post("/community/:communityId", requireMember(), createEquipment);
equipmentRouter.get("/community/:communityId", requireMember(), listEquipment);

// Equipment-specific routes
equipmentRouter.get("/:id", getEquipment);
equipmentRouter.patch("/:id", updateEquipment);
equipmentRouter.delete("/:id", deleteEquipment);
