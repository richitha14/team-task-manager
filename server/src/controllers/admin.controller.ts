import type { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";
import type { UpdateUserRoleInput } from "../validators/admin.validator.js";

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await adminService.listUsers();
  res.json({ users });
}

export async function updateUserRole(
  req: Request<{ userId: string }, unknown, UpdateUserRoleInput>,
  res: Response,
): Promise<void> {
  const user = await adminService.updateUserRole(
    req.user!.id,
    req.params.userId,
    req.body.role,
  );
  res.json({ user });
}
