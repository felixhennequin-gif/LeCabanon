import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  createCommunity,
  joinCommunity,
  getMyCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
  regenerateCode,
  removeMember,
} from "../controllers/communities.js";

export const communityRouter = Router();

communityRouter.use(authenticate);

communityRouter.post("/", createCommunity);
communityRouter.post("/join", joinCommunity);
communityRouter.get("/", getMyCommunities);
communityRouter.get("/:id", getCommunity);
communityRouter.patch("/:id", updateCommunity);
communityRouter.delete("/:id", deleteCommunity);
communityRouter.post("/:id/regenerate-code", regenerateCode);
communityRouter.delete("/:id/members/:userId", removeMember);
