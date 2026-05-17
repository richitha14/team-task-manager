import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import type { LoginInput, SignupInput } from "../validators/auth.validator.js";

export async function signup(
  req: Request<object, unknown, SignupInput>,
  res: Response,
): Promise<void> {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
}

export async function login(
  req: Request<object, unknown, LoginInput>,
  res: Response,
): Promise<void> {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getUserById(req.user!.id);
  res.json({ user });
}

export function logout(_req: Request, res: Response): void {
  res.json({ message: "Logged out successfully" });
}
