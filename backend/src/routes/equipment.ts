import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireMember } from "../middlewares/requireMember.js";
import { upload } from "../middlewares/upload.js";
import {
  createEquipment,
  listEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
  uploadEquipmentPhotos,
  deleteEquipmentPhoto,
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

// Equipment photos
equipmentRouter.post("/:id/photos", upload.array("photos", 5), uploadEquipmentPhotos);
equipmentRouter.delete("/:id/photos/:photoId", deleteEquipmentPhoto);
