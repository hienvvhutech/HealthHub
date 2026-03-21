// controllers/reexam.controller.ts
import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { sendReExamEmail } from "../utils/mailer";

export const getReExamAppointments = async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId;

    if (!patientId) {
      return res.status(401).json({ message: "Không xác định được bệnh nhân" });
    }

    const medicalRecordsWithReExam = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        reExamDate: {
          not: null,
        },
      },
      include: {
        appointment: {
          include: {
            doctor: {
              include: {
                specialty: true,
              },
            },
          },
        },
      },
      orderBy: {
        reExamDate: "asc",
      },
    });

    const result = medicalRecordsWithReExam.map((record) => ({
      id: record.id, // 🆕 medicalRecord.id
      appointmentId: record.appointmentId,
      reExamDate: record.reExamDate,
      doctorName: record.appointment?.doctor?.fullName,
      specialty: record.appointment?.doctor?.specialty?.name || "Không rõ",
      note: record.note,
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy lịch tái khám:", error);
    res.status(500).json({ message: "Lỗi server khi lấy lịch tái khám" });
  }
};
export const confirmReExam = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true },
        },
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!record)
      return res.status(404).json({ message: "Không tìm thấy dữ liệu" });

    const patientEmail = record.patient.user.email;
    const doctorName = record.appointment?.doctor?.fullName || "Không rõ";
    const reExamDate = new Date(record.reExamDate ?? "");
    const date = reExamDate.toLocaleDateString("vi-VN");
    const time = reExamDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    await sendReExamEmail(patientEmail, doctorName, date, time);
    await prisma.medicalRecord.update({
      where: { id },
      data: { confirmedReExam: true },
    });
    res.json({ message: "Đã xác nhận tái khám và gửi email thành công" });
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    res.status(500).json({ message: "Lỗi khi xác nhận tái khám" });
  }
};

export const cancelReExam = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.medicalRecord.update({
      where: { id },
      data: { reExamDate: null },
    });
    res.json({ message: "Đã huỷ lịch tái khám" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi huỷ", error });
  }
};
