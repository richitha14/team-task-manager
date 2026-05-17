import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await dashboardService.getDashboardStats(
    req.user!.id,
    req.user!.role,
  );
  res.json({ stats });
}
