import express from "express";
import { getScreeningPlan, seedData } from "../controllers/screening.controller";
// import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// Gợi ý gói khám (Public để hỗ trợ Guest/Người cao tuổi chưa login)
router.post("/plan", getScreeningPlan);

// Tạo dữ liệu mẫu (Chỉ Admin hoặc chạy 1 lần)
router.post("/seed", seedData);

export default router;
