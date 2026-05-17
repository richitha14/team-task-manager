import type { ApiErrorResponse } from "@team-task-manager/shared";
import { env } from "../lib/env";

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

let tokenGetter: (() => string | null) | null = null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, token, ...init } = options;
  const url = new URL(path, env.apiUrl || window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const authToken = token ?? tokenGetter?.() ?? null;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new ApiError(
      body.error ?? `Request failed: ${response.status}`,
      response.status,
      body.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
