import type { AppRole } from "@team-task-manager/shared";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";

/** RBAC guard — use on routes after `authenticate`. */
export function requireRole(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "Insufficient permissions"));
      return;
    }

    next();
  };
}
