import prisma from "../../prisma/client";

/**
 * Hàm tự động huỷ các lịch hẹn quá hạn
 */
export const cancelOverdueAppointments = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await prisma.appointment.updateMany({
      where: {
        date: { lt: startOfToday },
        status: { in: ["pending", "waiting"] },
      },
      data: { status: "cancelled" },
    });

    if (result.count > 0) {
      console.log(`[Scheduler] Đã tự động hủy ${result.count} lịch hẹn quá hạn.`);
    }
  } catch (error) {
    console.error("[Scheduler] Lỗi khi quét lịch hẹn quá hạn:", error);
  }
};

/**
 * Hàm gửi thông báo nhắc tái khám (trước 2 ngày)
 */
export const sendReExamReminders = async (io: any) => {
  try {
    const now = new Date();
    const twoDaysLaterStart = new Date(now);
    twoDaysLaterStart.setDate(now.getDate() + 2);
    twoDaysLaterStart.setHours(0, 0, 0, 0);

    const twoDaysLaterEnd = new Date(twoDaysLaterStart);
    twoDaysLaterEnd.setHours(23, 59, 59, 999);

    const records = await prisma.medicalRecord.findMany({
      where: {
        reExamDate: {
          gte: twoDaysLaterStart,
          lte: twoDaysLaterEnd,
        },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { specialty: true } }, 
      },
    });

    for (const record of records) {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: record.patient.userId,
          type: "Reexam",
          message: { contains: `ngày ${twoDaysLaterStart.toLocaleDateString("vi-VN")}` },
        },
      });

      if (!existingNotif) {
        const specialtyName = record.doctor.specialty?.name || "Bác sĩ";
        const message = `Quý khách ${record.patient.fullName.toUpperCase()} có lịch tái khám chuyên khoa ${specialtyName.toUpperCase()} ngày ${twoDaysLaterStart.toLocaleDateString("vi-VN")}, vui lòng đăng ký lịch tái khám qua ứng dụng HealthHub.`;
        
        const notif = await prisma.notification.create({
          data: {
            userId: record.patient.userId,
            title: "NHẮC NB TÁI KHÁM",
            message,
            type: "Reexam",
            status: "Unread",
            scheduledAt: new Date(),
          },
        });

        if (io) {
          io.to(`user-${record.patient.userId}`).emit("newNotification", notif);
          io.to(`user-${record.patient.userId}`).emit("reExamReminder", notif);
        }
        
        console.log(`[Scheduler] Đã gửi nhắc tái khám cho ${record.patient.fullName}`);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Lỗi khi gửi nhắc tái khám:", error);
  }
};

/**
 * ✅ Hàm nhắc lịch khám trước 30p và 15p
 */
export const sendAppointmentReminders = async (io: any) => {
    try {
        const now = new Date();
        const startWindow = new Date(now.getTime() + 14 * 60 * 1000); // 14 mins from now
        const endWindow = new Date(now.getTime() + 31 * 60 * 1000);   // 31 mins from now

        // Lấy các lịch hẹn sắp tới trong khoảng 14-31 phút nữa
        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startWindow,
                    lte: endWindow,
                },
                status: { in: ["pending", "confirmed"] }, // Chỉ nhắc lịch chưa khám
            },
            include: {
                patient: { include: { user: true } },
                doctor: true,
            },
        });

        for (const appt of appointments) {
            // Bỏ qua nếu là Chủ Nhật (0 = Sunday)
            if (new Date(appt.date).getDay() === 0) continue;

            const timeDiff = new Date(appt.date).getTime() - now.getTime();
            const minutesLeft = Math.floor(timeDiff / (1000 * 60));

            let reminderType = "";
            let message = "";

            if (minutesLeft >= 29 && minutesLeft <= 31) {
                reminderType = "30min";
                message = `Chỉ còn 30 phút nữa đến giờ hẹn với BS. ${appt.doctor.fullName}. Vui lòng sắp xếp thời gian đến phòng khám.`;
            } else if (minutesLeft >= 14 && minutesLeft <= 16) {
                reminderType = "15min";
                message = `Khẩn cấp: Chỉ còn 15 phút nữa đến giờ hẹn với BS. ${appt.doctor.fullName}.`;
            } else {
                continue;
            }

            // Kiểm tra đã gửi loại nhắc nhở này chưa
            const existingNotif = await prisma.notification.findFirst({
                where: {
                    userId: appt.patient.userId,
                    type: "appointment_reminder",
                    message: { contains: reminderType === "30min" ? "30 phút" : "15 phút" },
                    // Cần kiểm tra thêm ID lịch hẹn trong message hoặc logic khác để tránh trùng lặp
                    // Cách tốt nhất là lưu appointmentId vào Notification model (cần migrate DB)
                    // Ở đây dùng message contains tạm thời
                    createdAt: {
                        gte: new Date(now.getTime() - 60 * 60 * 1000) // Chỉ check trong vòng 1 tiếng gần đây
                    }
                }
            });

            if (!existingNotif) {
                 const notif = await prisma.notification.create({
                    data: {
                        userId: appt.patient.userId,
                        title: `⏰ NHẮC LỊCH HẸN (${reminderType === "30min" ? "30p" : "15p"})`,
                        message,
                        type: "appointment_reminder",
                        status: "Unread",
                        scheduledAt: new Date(),
                    },
                });

                if (io) {
                    io.to(`user-${appt.patient.userId}`).emit("newNotification", notif);
                    io.to(`user-${appt.patient.userId}`).emit("appointmentReminder", notif);
                }
                console.log(`[Scheduler] Đã gửi nhắc ${reminderType} cho cuộc hẹn #${appt.id}`);
            }
        }

    } catch (error) {
        console.error("[Scheduler] Lỗi nhắc lịch hẹn:", error);
    }
}

// Hàm khởi chạy scheduler
let schedulerIo: any = null;

export const initSchedulerSocket = (io: any) => {
    schedulerIo = io;
}

export const startScheduler = () => {
  // Chạy ngay khi khởi động
  cancelOverdueAppointments();
  if(schedulerIo) {
      sendReExamReminders(schedulerIo);
      sendAppointmentReminders(schedulerIo);
  }

  // Chạy mỗi 1 phút để check chính xác
  setInterval(() => {
      if(schedulerIo) sendAppointmentReminders(schedulerIo);
  }, 60 * 1000); 

  // Chạy mỗi 1 giờ cho các task dài hạn
  setInterval(() => {
      cancelOverdueAppointments();
      if(schedulerIo) sendReExamReminders(schedulerIo);
  }, 60 * 60 * 1000);
  
  console.log("[Scheduler] Đã khởi động trình dọn dẹp và nhắc lịch.");
};
