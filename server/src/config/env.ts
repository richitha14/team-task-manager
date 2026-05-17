import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const serverDir = process.cwd();
const rootDir = resolve(serverDir, "..");

for (const envPath of [
  resolve(rootDir, ".env"),
  resolve(serverDir, ".env"),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

const PLACEHOLDER_SECRETS = [
  "change-me",
  "your-secret",
  "dev-only-secret",
  "minimum-32-characters",
] as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  /** Comma-separated allowed origins, e.g. https://app.up.railway.app */
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z
    .string({
      required_error: "JWT_SECRET is required",
      invalid_type_error: "JWT_SECRET must be a string",
    })
    .min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  /** Serve built React app from Express (recommended for Railway single-service deploy) */
  SERVE_CLIENT: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  CLIENT_DIST_PATH: z.string().optional(),
});

function isWeakJwtSecret(secret: string): boolean {
  const normalized = secret.toLowerCase();
  return PLACEHOLDER_SECRETS.some((fragment) => normalized.includes(fragment));
}

function resolveServeClient(
  explicit: boolean | undefined,
  nodeEnv: string,
): boolean {
  if (explicit !== undefined) return explicit;
  return nodeEnv === "production";
}

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n❌ Environment validation failed. Server will not start.\n");
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "env";
      console.error(`  • ${path}: ${issue.message}`);
    }
    if (!process.env.JWT_SECRET?.trim()) {
      console.error(
        "\n  Hint: Set JWT_SECRET in Railway variables (32+ random characters).\n",
      );
    }
    if (!process.env.DATABASE_URL?.trim()) {
      console.error(
        "\n  Hint: Link a PostgreSQL plugin on Railway — DATABASE_URL is injected automatically.\n",
      );
    }
    process.exit(1);
  }

  const parsed = result.data;

  if (parsed.NODE_ENV === "production" && isWeakJwtSecret(parsed.JWT_SECRET)) {
    console.error(
      "\n❌ JWT_SECRET appears to be a placeholder. Use a strong random secret in production.\n",
    );
    process.exit(1);
  }

  const corsOrigins = parsed.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    ...parsed,
    corsOrigins,
    serveClient: resolveServeClient(parsed.SERVE_CLIENT, parsed.NODE_ENV),
    clientDistPath:
      parsed.CLIENT_DIST_PATH ?? resolve(rootDir, "client", "dist"),
  };
}

export const env = loadEnv();

export type Env = typeof env;
