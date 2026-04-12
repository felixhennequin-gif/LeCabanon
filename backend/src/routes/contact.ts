import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireSiteAdmin } from "../middlewares/requireSiteAdmin.js";
import { submitContact, listContactMessages, markContactMessageRead } from "../controllers/contact.js";

export const contactRouter = Router();

// Public — POST /api/contact
contactRouter.post("/", submitContact);

export const adminContactRouter = Router();

// Admin only — GET /api/admin/contact-messages
adminContactRouter.get("/contact-messages", authenticate, requireSiteAdmin, listContactMessages);
// Admin only — PATCH /api/admin/contact-messages/:id/read
adminContactRouter.patch("/contact-messages/:id/read", authenticate, requireSiteAdmin, markContactMessageRead);
