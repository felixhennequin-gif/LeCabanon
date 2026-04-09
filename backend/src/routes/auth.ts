import { Router } from "express";
import { register, login, refreshToken, getMe } from "../controllers/auth.js";
import { googleCallback } from "../controllers/google-auth.js";
import { authenticate } from "../middlewares/authenticate.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshToken);
authRouter.get("/me", authenticate, getMe);
authRouter.post("/google", googleCallback);
