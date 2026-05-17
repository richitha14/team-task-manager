import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  loadProjectAccess,
  requireProjectRole,
} from "../middleware/requireProjectAccess.js";
import { validateBody } from "../middleware/validate.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  updateMemberRoleSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";
import { taskRouter } from "./task.routes.js";

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get("/", projectController.listProjects);
projectRouter.post(
  "/",
  validateBody(createProjectSchema),
  projectController.createProject,
);

projectRouter.get(
  "/:id",
  loadProjectAccess,
  projectController.getProject,
);

projectRouter.patch(
  "/:id",
  loadProjectAccess,
  requireProjectRole("ADMIN"),
  validateBody(updateProjectSchema),
  projectController.updateProject,
);

projectRouter.delete(
  "/:id",
  loadProjectAccess,
  requireProjectRole("ADMIN"),
  projectController.deleteProject,
);

projectRouter.get(
  "/:id/members",
  loadProjectAccess,
  projectController.listMembers,
);

projectRouter.post(
  "/:id/members",
  loadProjectAccess,
  requireProjectRole("ADMIN"),
  validateBody(addProjectMemberSchema),
  projectController.addMember,
);

projectRouter.patch(
  "/:id/members/:userId",
  loadProjectAccess,
  requireProjectRole("ADMIN"),
  validateBody(updateMemberRoleSchema),
  projectController.updateMemberRole,
);

projectRouter.delete(
  "/:id/members/:userId",
  loadProjectAccess,
  requireProjectRole("ADMIN"),
  projectController.removeMember,
);

projectRouter.use("/:id/tasks", loadProjectAccess, taskRouter);
