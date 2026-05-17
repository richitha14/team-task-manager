import type { AuthResponse, AuthUser } from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function signup(payload: SignupPayload) {
  return apiClient<AuthResponse>(API_ROUTES.auth.signup, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return apiClient<AuthResponse>(API_ROUTES.auth.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe(token?: string) {
  return apiClient<{ user: AuthUser }>(API_ROUTES.auth.me, { token });
}

export function logoutApi(token?: string) {
  return apiClient<{ message: string }>(API_ROUTES.auth.logout, {
    method: "POST",
    token,
  });
}
