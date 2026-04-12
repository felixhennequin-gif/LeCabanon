import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  listConversations,
  getMessages,
  createConversation,
  sendMessage,
} from "../controllers/messages.js";

export const messageRouter = Router();

messageRouter.get("/conversations", authenticate, listConversations);
messageRouter.post("/conversations", authenticate, createConversation);
messageRouter.get("/conversations/:id/messages", authenticate, getMessages);
messageRouter.post("/conversations/:id/messages", authenticate, sendMessage);
