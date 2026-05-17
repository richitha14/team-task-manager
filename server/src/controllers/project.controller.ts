import type { Request, Response } from "express";
import { paramId } from "../lib/params.js";
import * as projectService from "../services/project.service.js";
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  UpdateMemberRoleInput,
  UpdateProjectInput,
} from "../validators/project.validator.js";

export async function listProjects(req: Request, res: Response): Promise<void> {
  const projects = await projectService.listProjectsForUser(
    req.user!.id,
    req.user!.role,
  );
  res.json({ projects });
}

export async function createProject(
  req: Request<object, unknown, CreateProjectInput>,
  res: Response,
): Promise<void> {
  const project = await projectService.createProject(req.user!.id, req.body);
  res.status(201).json({ project });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await projectService.getProjectDetail(
    paramId(req.params.id),
    req.user!.id,
    req.user!.role,
  );
  res.json({ project });
}

export async function updateProject(
  req: Request<{ id: string }, unknown, UpdateProjectInput>,
  res: Response,
): Promise<void> {
  const project = await projectService.updateProject(
    paramId(req.params.id),
    req.user!.id,
    req.user!.role,
    req.body,
  );
  res.json({ project });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  await projectService.deleteProject(paramId(req.params.id));
  res.status(204).send();
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const members = await projectService.listProjectMembers(
    paramId(req.params.id),
    req.user!.id,
    req.user!.role,
  );
  res.json({ members });
}

export async function addMember(
  req: Request<{ id: string }, unknown, AddProjectMemberInput>,
  res: Response,
): Promise<void> {
  const member = await projectService.addProjectMember(
    paramId(req.params.id),
    req.body,
  );
  res.status(201).json({ member });
}

export async function updateMemberRole(
  req: Request<{ id: string; userId: string }, unknown, UpdateMemberRoleInput>,
  res: Response,
): Promise<void> {
  const member = await projectService.updateProjectMemberRole(
    paramId(req.params.id),
    paramId(req.params.userId),
    req.body.role,
  );
  res.json({ member });
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  await projectService.removeProjectMember(
    paramId(req.params.id),
    paramId(req.params.userId),
  );
  res.status(204).send();
}
