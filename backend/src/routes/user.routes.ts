import express from "express";
import {
  getMe,
  getUserById,
  searchUsers,
  updateProfile,
  updateProfilePicture
} from "../controllers/user.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/me", authenticate, getMe);

router.get("/search", authenticate, searchUsers);

router.get("/:id", authenticate, getUserById);

router.patch("/profile", authenticate, updateProfile);

router.patch(
  "/profile-picture",
  authenticate,
  upload.single("file"),
  updateProfilePicture
);

export default router;