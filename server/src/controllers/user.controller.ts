import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";
import { searchUsersSchema } from "../validators/user.validator.js";

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const query = searchUsersSchema.parse(req.query);
  const users = await userService.searchUsers(
    query.q,
    query.limit,
    query.excludeProjectId,
  );
  res.json({ users });
}
