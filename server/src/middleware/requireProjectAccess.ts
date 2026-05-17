import type { ProjectRole } from "@team-task-manager/shared";
import type { NextFunction, Request, Response } from "express";
import { paramId } from "../lib/params.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

/** Load project membership; app ADMIN bypasses project role checks. */
export async function loadProjectAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const projectId = paramId(req.params.projectId ?? req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      throw new AppError(404, "Project not found");
    }

    if (req.user.role === "ADMIN") {
      req.projectAccess = {
        projectId: project.id,
        membershipRole: "ADMIN",
        isOwner: project.ownerId === req.user.id,
      };
      next();
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, "You do not have access to this project");
    }

    req.projectAccess = {
      projectId: project.id,
      membershipRole: membership.role,
      isOwner: project.ownerId === req.user.id,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/** Require project-level role (after loadProjectAccess). */
export function requireProjectRole(...roles: ProjectRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.projectAccess) {
      next(new AppError(500, "Project access not loaded"));
      return;
    }

    if (!roles.includes(req.projectAccess.membershipRole)) {
      next(new AppError(403, "Insufficient project permissions"));
      return;
    }

    next();
  };
}
