import { Router } from "express";
import { getRevenue } from "../controllers/revenue.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// Chỉ admin xem KPI (hoặc mở cho tất cả)
router.get("/", verifyToken, getRevenue);

export default router;
