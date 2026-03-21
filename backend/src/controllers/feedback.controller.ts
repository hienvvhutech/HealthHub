import { Request, Response } from "express";
import prisma from "../../prisma/client";

// Lấy tất cả phản hồi
export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy feedback" });
  }
};

// Tạo phản hồi mới
export const createFeedback = async (req: Request, res: Response) => {
  const { fullName, email, message, doctorId, appointmentId } = req.body;

  if (!fullName || !email || !message || !doctorId || !appointmentId) {
    return res.status(400).json({ message: "Thiếu thông tin phản hồi" });
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        fullName,
        email,
        message,
        doctor: { connect: { id: doctorId } },
        appointment: { connect: { id: appointmentId } },
      },
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gửi phản hồi" });
  }
};

// Lấy phản hồi theo bác sĩ
export const getFeedbacksByDoctor = async (req: Request, res: Response) => {
  const doctorId = Number(req.params.id);
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });
    res.json(feedbacks);
  } catch {
    res.status(500).json({ message: "Không thể lấy feedback" });
  }
};
