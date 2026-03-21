import { Request, Response } from "express";
import prisma from "../../prisma/client";

// API: POST /api/reminder/push
// Chức năng: Quét và gửi thông báo nhắc nhở tự động
export const pushReminders = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Nhắc lịch tái khám (Re-exam) sắp tới (trong ngày mai)
    const upcomingReexams = await prisma.reexam.findMany({
      where: {
        reexamDate: {
          gte: today,
          lt: tomorrow,
        },
        onTime: false, // Chưa xác nhận đến
      },
      include: { patient: { include: { user: true } } },
    });

    let sentCount = 0;

    for (const reexam of upcomingReexams) {
      if (reexam.patient?.user) {
        // Tạo thông báo trong DB (để hiển thị trên App)
        await prisma.notification.create({
          data: {
            userId: reexam.patient.user.id,
            title: "📅 Nhắc lịch tái khám",
            message: `Bạn có lịch tái khám vào ngày mai (${new Date(reexam.reexamDate).toLocaleDateString("vi-VN")}). Vui lòng sắp xếp thời gian!`,
            type: "Reexam",
          },
        });
        
        // TODO: Tích hợp FCM (Firebase Cloud Messaging) ở đây để push notification thật xuống điện thoại
        // sendFCM(reexam.patient.user.fcmToken, ...)
        
        sentCount++;
      }
    }

    // 2. Nhắc uống thuốc (Medication) - Demo logic
    // (Trong thực tế sẽ quét bảng Prescription và lịch uống thuốc chi tiết)
    
    res.json({
      message: "Đã gửi nhắc nhở thành công",
      stats: {
        reexams_reminded: sentCount,
        medications_reminded: 0, // Placeholder
      },
    });

  } catch (error) {
    console.error("Reminder Error:", error);
    res.status(500).json({ message: "Lỗi khi gửi nhắc nhở" });
  }
};

// API: GET /api/reminder/history
// Lấy lịch sử thông báo của user
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
