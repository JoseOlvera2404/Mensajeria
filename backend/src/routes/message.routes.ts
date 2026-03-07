import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  sendFileMessage
} from "../controllers/message.controller.js";

const router = Router();

router.post("/", authenticate, sendMessage);

router.get("/:conversationId", authenticate, getMessages);

router.post("/read", authenticate, markMessagesAsRead);

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  sendFileMessage
);

export default router;