import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/authRateLimit.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import {
  loginSchema,
  signupSchema,
} from "../validators/auth.validator.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authRateLimiter,
  validateBody(signupSchema),
  authController.signup,
);
authRouter.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  authController.login,
);
authRouter.get("/me", authenticate, authController.me);
authRouter.post("/logout", authenticate, authController.logout);
