import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import {
  createPrivateConversation,
  createGroupConversation,
  getUserConversations,
  getConversation
} from "../controllers/conversation.controller.js";

const router = Router();

router.post("/private", authenticate, createPrivateConversation);

router.post("/group", authenticate, createGroupConversation);

router.get("/", authenticate, getUserConversations);

router.get("/:id", authenticate, getConversation);

export default router;