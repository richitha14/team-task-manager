import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { healthRouter } from "./health.routes.js";
import { projectRouter } from "./project.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/projects", projectRouter);
