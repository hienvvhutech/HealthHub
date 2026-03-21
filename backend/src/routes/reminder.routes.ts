import express from "express";
import { pushReminders, getNotifications } from "../controllers/reminder.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// Trigger gửi nhắc nhở (Thường được gọi bởi Cron Job hoặc Admin)
router.post("/push", pushReminders);

// Lấy danh sách thông báo của user
router.get("/history", verifyToken, getNotifications);

export default router;
