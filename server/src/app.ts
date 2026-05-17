import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { existsSync } from "node:fs";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(express.json());

  app.get("/", (_req, res) => {
    if (env.serveClient) {
      const indexFile = path.join(
        path.resolve(env.clientDistPath),
        "index.html"
      );
  
      res.sendFile(indexFile);
      return;
    }
  
    res.json({
      message: "Team Task Manager API",
      health: "/api/health",
    });
  });

  app.use("/api", apiRouter);

  if (env.serveClient) {
    const distPath = path.resolve(env.clientDistPath);
    if (!existsSync(distPath)) {
      console.warn(
        `⚠️  SERVE_CLIENT enabled but build not found at ${distPath}. Run: npm run build -w client`,
      );
    } else {
      app.use(
        express.static(distPath, {
          maxAge: env.NODE_ENV === "production" ? "1d" : 0,
          index: false,
        }),
      );
      app.get(/^(?!\/api).*/, (_req, res, next) => {
        const indexFile = path.join(distPath, "index.html");
        if (!existsSync(indexFile)) {
          next(new Error("Client index.html not found"));
          return;
        }
        res.sendFile(indexFile);
      });
    }
  }

  app.use(errorHandler);

  return app;
}
