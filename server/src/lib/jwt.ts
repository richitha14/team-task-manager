import jwt from "jsonwebtoken";
import type { AppRole } from "@team-task-manager/shared";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  email: string;
  role: AppRole;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
