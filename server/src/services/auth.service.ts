import type { AuthResponse, AuthUser } from "@team-task-manager/shared";
import bcrypt from "bcryptjs";
import { AppRole } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { signToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import type { LoginInput, SignupInput } from "../validators/auth.validator.js";

const SALT_ROUNDS = 12;

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

function buildAuthResponse(user: {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  createdAt: Date;
}): AuthResponse {
  const authUser = toAuthUser(user);
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return { user: authUser, token };
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? AppRole.ADMIN : AppRole.MEMBER;

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role,
    },
  });

  return buildAuthResponse(user);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  return buildAuthResponse(user);
}

export async function getUserById(id: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return toAuthUser(user);
}
