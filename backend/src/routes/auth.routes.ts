import { Router } from "express";
import {
  register,
  login,
  me,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  requestRegisterCode,
  requestPasswordChangeCode,
  generateBiometricChallenge,
  registerBiometric,
  biometricLogin
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

router.get("/biometric/challenge", generateBiometricChallenge);

router.post("/biometric/register", authenticate, registerBiometric);

router.post("/biometric/login", biometricLogin);
export default router;