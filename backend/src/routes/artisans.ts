import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireMember } from "../middlewares/requireMember.js";
import {
  createArtisan,
  listArtisans,
  getArtisan,
  getArtisanPublic,
  updateArtisan,
  deleteArtisan,
  createReview,
  listReviews,
} from "../controllers/artisans.js";
import { claimArtisan, verifyClaim, updateArtisanProfile } from "../controllers/claim.js";

export const artisanRouter = Router();

// Public routes (no auth)
artisanRouter.get("/:id/public", getArtisanPublic);

// Protected routes
artisanRouter.use(authenticate);

// Community-scoped routes
artisanRouter.post("/community/:communityId", requireMember(), createArtisan);
artisanRouter.get("/community/:communityId", requireMember(), listArtisans);

// Artisan-specific routes
artisanRouter.get("/:id", getArtisan);
artisanRouter.patch("/:id", updateArtisan);
artisanRouter.delete("/:id", deleteArtisan);

// Claim
artisanRouter.post("/:id/claim", claimArtisan);
artisanRouter.post("/:id/verify-claim", verifyClaim);
artisanRouter.patch("/:id/profile", updateArtisanProfile);

// Reviews
artisanRouter.post("/:id/reviews", createReview);
artisanRouter.get("/:id/reviews", listReviews);
