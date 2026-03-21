import { RequestHandler } from "express";
import { Request, Response } from "express";

import prisma from "../../prisma/client";

export const addHealthData: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const { metric, value, source, patientId } = req.body;

    if (!patientId) {
      res.status(400).json({ success: false, message: "Thiếu patientId!" });
      return;
    }

    await prisma.healthData.create({
      data: {
        userId: Number(userId),
        patientId: Number(patientId), 
        metric,
        value,
        source: source || "Manual Input",
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ addHealthData error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add health data" });
  }
};
// 📊 Lấy dữ liệu theo user
export const getHealthData: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const data = await prisma.healthData.findMany({
      where: { userId: Number(userId) },
      orderBy: { collectedAt: "desc" },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ getHealthData error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// 🗑️ Xóa dữ liệu
export const deleteHealthData: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const dataId = Number(req.params.id);
    await prisma.healthData.deleteMany({
      where: { id: dataId, userId: Number(userId) },
    });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ deleteHealthData error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// 📡 Nhận dữ liệu từ thiết bị IoT (không cần token)
export const uploadIoTData: RequestHandler = async (req, res): Promise<void> => {
  try {
    // Nhận patientId và các chỉ số từ body
    const { patientId, bloodPressure, glucose, heartRate } = req.body;

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    // Chuẩn bị dữ liệu để lưu
    // Lưu dạng JSON string cho metric 'IoT' để dễ vẽ biểu đồ
    // Hoặc lưu từng record riêng lẻ. Ở đây lưu gộp để tiện cho HomePatient chart
    const newData = {
        time: new Date().toLocaleTimeString(),
        bloodPressure: Number(bloodPressure),
        glucose: Number(glucose),
        heartRate: Number(heartRate),
    };

    const patient = await prisma.patient.findUnique({
      where: { id: Number(patientId) },
      include: { user: true }
    });

    if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
    }

    const userId = patient.userId;

    // Lưu vào DB (Lưu 1 record gộp cho Chart)
    await prisma.healthData.create({
      data: {
        patientId: Number(patientId),
        userId: userId, 
        metric: "IoT", // Key để frontend filter
        value: JSON.stringify(newData),
        source: "IoT Device",
      },
    });

    // 🚀 LOGIC KIỂM TRA NGƯỠNG NGUY HIỂM & TẠO THÔNG BÁO 🚀
    const io = req.app.get("io");
    let alertCreated = false;

    if (heartRate && Number(heartRate) > 120) {
        const notif = await prisma.notification.create({
            data: {
                userId: userId,
                title: "⚠️ CẢNH BÁO NHỊP TIM",
                message: `Nhịp tim của bạn quá cao (${heartRate} bpm). Vui lòng nghỉ ngơi và đặt lịch khám nếu cần thiết.`,
                type: "health_alert",
                status: "Unread",
                scheduledAt: new Date()
            }
        });
        if (io) io.to(`user-${userId}`).emit("newNotification", notif); // Emit để update chuông
        alertCreated = true;
    }

    if (bloodPressure && Number(bloodPressure) > 140) {
         const notif = await prisma.notification.create({
            data: {
                userId: userId,
                title: "⚠️ CẢNH BÁO HUYẾT ÁP",
                message: `Huyết áp của bạn đang ở mức cao (${bloodPressure} mmHg). Hãy theo dõi và liên hệ bác sĩ.`,
                type: "health_alert",
                status: "Unread",
                scheduledAt: new Date()
            }
        });
        if (io) io.to(`user-${userId}`).emit("newNotification", notif);
        alertCreated = true;
    }

    if (glucose && Number(glucose) > 180) {
        const notif = await prisma.notification.create({
           data: {
               userId: userId,
               title: "⚠️ CẢNH BÁO ĐƯỜNG HUYẾT",
               message: `Chỉ số đường huyết cao (${glucose} mg/dL). Cần chú ý chế độ ăn uống và kiểm tra y tế.`,
               type: "health_alert",
               status: "Unread",
               scheduledAt: new Date()
           }
       });
       if (io) io.to(`user-${userId}`).emit("newNotification", notif);
       alertCreated = true;
   }

    // Emit alert popup (nếu có)
    if (alertCreated && io) {
        io.to(`user-${userId}`).emit("healthAlert", { message: "Phát hiện chỉ số sức khỏe bất thường! Kiểm tra thông báo." });
    }

    res.status(201).json({
      message: "✅ Dữ liệu IoT đã được ghi nhận thành công!",
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi ghi dữ liệu IoT:", error);
    res.status(500).json({
      message: "Lỗi server khi ghi dữ liệu IoT",
      error: error.message,
    });
  }
};
// Lấy tất cả HealthData theo patientId
export const getHealthDataByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = Number(req.params.patientId);

    if (!patientId) {
      res.status(400).json({ message: "Missing patientId" });
      return;
    }

    const records = await prisma.healthData.findMany({
      where: { patientId },
      orderBy: { id: "asc" }, // Lấy theo thứ tự thời gian để vẽ biểu đồ
    });

    res.json({ data: records });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getHealthDataForDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = Number(req.params.patientId);

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    const data = await prisma.healthData.findMany({
      where: { patientId },
      orderBy: { collectedAt: "desc" },
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu cho bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};
