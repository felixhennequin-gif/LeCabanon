import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  getInviteInfo,
  joinViaInvite,
} from "../controllers/invitations.js";

export const invitationRouter = Router();

// Community-scoped routes (admin only)
invitationRouter.post("/communities/:id/invitations", authenticate, createInvitation);
invitationRouter.get("/communities/:id/invitations", authenticate, listInvitations);
invitationRouter.delete("/communities/:id/invitations/:invitationId", authenticate, revokeInvitation);

// Public invite routes
invitationRouter.get("/invite/:token", getInviteInfo);
invitationRouter.post("/invite/:token/join", authenticate, joinViaInvite);
