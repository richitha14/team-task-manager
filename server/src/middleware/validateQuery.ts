import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "./errorHandler.js";

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Request["query"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const key = issue.path.join(".") || "query";
          if (!details[key]) details[key] = [];
          details[key].push(issue.message);
        }
        next(new AppError(400, "Validation failed", details));
        return;
      }
      next(error);
    }
  };
}
