import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
export const userRouter = Router();

userRouter.get("/search", authenticate, userController.searchUsers);
