import { Request, Response } from "express";
import prisma from "../../prisma/client";

// Lấy danh sách thông báo của user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông báo" });
  }
};

// Tạo thông báo mới (Dùng cho cả Internal & API gọi từ Frontend)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type, userId } = req.body;
    const targetUserId = (req as any).user?.id || userId;

    const notif = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        message,
        type, 
        status: "Unread"
      }
    });

    // ✅ Emit Socket Event (Real-time notification update)
    const io = req.app.get("io");
    if (io) {
        io.to(`user-${targetUserId}`).emit("newNotification", notif);
    }

    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo thông báo" });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id: Number(id) },
      data: { status: "Read" }
    });
    res.json({ message: "Đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

// ✅ Lấy số thông báo chưa đọc
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const count = await prisma.notification.count({
            where: {
                userId,
                status: "Unread"
            }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: "Lỗi đếm thông báo" });
    }
}
