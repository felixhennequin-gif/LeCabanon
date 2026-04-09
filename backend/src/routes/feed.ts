import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireMember } from "../middlewares/requireMember.js";
import { getFeed } from "../controllers/feed.js";

export const feedRouter = Router();

feedRouter.use(authenticate);

feedRouter.get("/:communityId/feed", requireMember("communityId"), getFeed);
