import { Router, Request, Response, NextFunction } from "express";
import { getDashboardStats, getKPISummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getDashboardStats(req, res)).catch(next);
});

// ✅ Route mới cho KPI
router.get("/kpi-summary", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getKPISummary(req, res)).catch(next);
});

export default router;
