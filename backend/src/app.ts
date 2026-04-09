import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { userRouter } from "./routes/users.js";
import { communityRouter } from "./routes/communities.js";
import { equipmentRouter } from "./routes/equipment.js";
import { artisanRouter } from "./routes/artisans.js";
import { feedRouter } from "./routes/feed.js";
import { invitationRouter } from "./routes/invitations.js";
import { opengraphRouter } from "./routes/opengraph.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
app.use("/api/communities", feedRouter);
app.use("/api", invitationRouter);
app.use("/api/opengraph", opengraphRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../../../frontend/dist");
  app.use(express.static(frontendDist));

  // SPA fallback — only for non-API routes
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Error handler (after all routes including SPA fallback)
app.use(errorHandler);

export { app };
