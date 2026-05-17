import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { validateBody } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.validator.js";

export const taskRouter = Router({ mergeParams: true });

taskRouter.get("/", taskController.listTasks);
taskRouter.post(
  "/",
  validateBody(createTaskSchema),
  taskController.createTask,
);
taskRouter.get("/:taskId", taskController.getTask);
taskRouter.patch(
  "/:taskId",
  validateBody(updateTaskSchema),
  taskController.updateTask,
);
taskRouter.delete("/:taskId", taskController.deleteTask);
