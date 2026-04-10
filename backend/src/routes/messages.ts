import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  listConversations,
  getMessages,
  createConversation,
  sendMessage,
} from "../controllers/messages.js";

export const messageRouter = Router();

messageRouter.use(authenticate);

messageRouter.get("/conversations", listConversations);
messageRouter.post("/conversations", createConversation);
messageRouter.get("/conversations/:id/messages", getMessages);
messageRouter.post("/conversations/:id/messages", sendMessage);
