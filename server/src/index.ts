import { execSync } from "node:child_process";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

function runMigrations() {
  if (process.env.SKIP_MIGRATIONS === "true") {
    console.log("Skipping migrations (SKIP_MIGRATIONS=true)");
    return;
  }
  console.log("Running database migrations…");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  console.log("Migrations complete.");
}

async function bootstrap() {
  if (env.NODE_ENV === "production") {
    try {
      runMigrations();
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  }

  const app = createApp();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${env.PORT}`);
    console.log(`  NODE_ENV=${env.NODE_ENV}`);
    console.log(`  serveClient=${env.serveClient}`);
    if (env.serveClient) {
      console.log(`  client=${env.clientDistPath}`);
    }
  });

  async function shutdown(signal: string) {
    console.log(`\n${signal} received, shutting down…`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();
