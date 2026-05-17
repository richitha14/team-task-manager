import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { updateUserRoleSchema } from "../validators/admin.validator.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/users", adminController.listUsers);
adminRouter.patch(
  "/users/:userId/role",
  validateBody(updateUserRoleSchema),
  adminController.updateUserRole,
);
