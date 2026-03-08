import { Router } from "express";
import {
  register,
  login,
  me,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  requestRegisterCode,
  requestPasswordChangeCode
} from "../controllers/auth.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticate, me);

router.patch("/password", authenticate, changePassword);

router.post("/password-reset/request", requestPasswordReset);

router.post("/password-reset/confirm", confirmPasswordReset);

router.post("/register-code", requestRegisterCode);

router.post("/password-code", requestPasswordChangeCode);

export default router;