import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import {
  sendFriendRequest,
  acceptFriendRequest,
  blockUser,
  getFriends,
  getFriendRequests,
  deleteFriend,
  getBlockedUsers,
  unblockUser,
  getFriendStatus,
  rejectFriendRequest
} from "../controllers/friend.controller.js";
import { get } from "node:http";

const router = Router();

router.post("/request", authenticate, sendFriendRequest);

router.post("/accept", authenticate, acceptFriendRequest);

router.post("/block", authenticate, blockUser);

router.get("/", authenticate, getFriends);

router.get("/requests", authenticate, getFriendRequests);

router.delete("/:id", authenticate, deleteFriend);

router.get("/blocked", authenticate, getBlockedUsers);

router.post("/unblock", authenticate, unblockUser);

router.get("/status/:userId", authenticate, getFriendStatus);

router.post("/reject", authenticate, rejectFriendRequest);

export default router;