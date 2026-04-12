import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireSiteAdmin } from "../middlewares/requireSiteAdmin.js";
import { listPages, getPageBySlug, updatePage } from "../controllers/pages.js";

export const pageRouter = Router();

// Public
pageRouter.get("/", listPages);
pageRouter.get("/:slug", getPageBySlug);

// Admin only
pageRouter.patch("/:slug", authenticate, requireSiteAdmin, updatePage);
