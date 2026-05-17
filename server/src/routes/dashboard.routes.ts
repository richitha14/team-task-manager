import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, dashboardController.getStats);
