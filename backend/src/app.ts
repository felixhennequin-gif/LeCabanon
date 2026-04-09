import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { userRouter } from "./routes/users.js";
import { communityRouter } from "./routes/communities.js";
import { equipmentRouter } from "./routes/equipment.js";
import { artisanRouter } from "./routes/artisans.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/communities", communityRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/artisans", artisanRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use(errorHandler);

export { app };
