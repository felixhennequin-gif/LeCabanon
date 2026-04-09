import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireMember } from "../middlewares/requireMember.js";
import {
  createArtisan,
  listArtisans,
  getArtisan,
  updateArtisan,
  deleteArtisan,
  createReview,
  listReviews,
} from "../controllers/artisans.js";

export const artisanRouter = Router();

artisanRouter.use(authenticate);

// Community-scoped routes
artisanRouter.post("/community/:communityId", requireMember(), createArtisan);
artisanRouter.get("/community/:communityId", requireMember(), listArtisans);

// Artisan-specific routes
artisanRouter.get("/:id", getArtisan);
artisanRouter.patch("/:id", updateArtisan);
artisanRouter.delete("/:id", deleteArtisan);

// Reviews
artisanRouter.post("/:id/reviews", createReview);
artisanRouter.get("/:id/reviews", listReviews);
