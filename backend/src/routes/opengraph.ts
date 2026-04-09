import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { getOpenGraph } from "../controllers/opengraph.js";

export const opengraphRouter = Router();

opengraphRouter.get("/", authenticate, getOpenGraph);
