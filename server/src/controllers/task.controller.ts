import type { Request, Response } from "express";
import { paramId } from "../lib/params.js";
import * as taskService from "../services/task.service.js";
import { listTasksQuerySchema } from "../validators/task.validator.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../validators/task.validator.js";

function projectRole(req: Request) {
  return req.projectAccess!.membershipRole;
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const query = listTasksQuerySchema.parse(req.query);
  const tasks = await taskService.listTasks(
    paramId(req.params.id),
    req.user!.id,
    req.user!.role,
    query,
  );
  res.json({ tasks });
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTask(
    paramId(req.params.id),
    paramId(req.params.taskId),
    req.user!.id,
    req.user!.role,
  );
  res.json({ task });
}

export async function createTask(
  req: Request<{ id: string }, unknown, CreateTaskInput>,
  res: Response,
): Promise<void> {
  const task = await taskService.createTask(
    paramId(req.params.id),
    req.user!.id,
    req.user!.role,
    projectRole(req),
    req.body,
  );
  res.status(201).json({ task });
}

export async function updateTask(
  req: Request<{ id: string; taskId: string }, unknown, UpdateTaskInput>,
  res: Response,
): Promise<void> {
  const task = await taskService.updateTask(
    paramId(req.params.id),
    paramId(req.params.taskId),
    req.user!.id,
    req.user!.role,
    projectRole(req),
    req.body,
  );
  res.json({ task });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  await taskService.deleteTask(
    paramId(req.params.id),
    paramId(req.params.taskId),
    req.user!.id,
    req.user!.role,
    projectRole(req),
  );
  res.status(204).send();
}
