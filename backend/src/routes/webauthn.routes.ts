import { Router } from "express";
import {
  registerOptions,
  registerVerify,
  loginOptions,
  loginVerify
} from "../controllers/webauthn.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// registro
router.post("/register/options", authenticate, registerOptions);
router.post("/register/verify", authenticate, registerVerify);

// login
router.post("/login/options", loginOptions);
router.post("/login/verify", loginVerify);

export default router;