import express from "express";
import { getNotifications, createNotification, markAsRead, getUnreadCount } from "../controllers/notification.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
// ✅ Route lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, getUnreadCount); 
router.post("/", verifyToken, createNotification);
router.patch("/:id/read", verifyToken, markAsRead);

export default router;
