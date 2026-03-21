import { Request, Response } from "express";
import prisma from "../../prisma/client";

// ✅ Lấy lịch sử khám của bệnh nhân (từ token)
export const getMedicalRecordsByPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;
    const patientId = user?.patientId;

    if (!patientId) return res.status(401).json({ message: "Unauthorized" });

    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        type: "history",
      },
      orderBy: { date: "desc" },
      include: {
        doctor: true,
        prescription: {
          include: { medications: true },
        },
        appointment: {
          include: { canLamSangs: true },
        },
      },
    });

    console.log("📋 Medical Records:", records.length);
    res.json(records);
  } catch (error) {
    console.error("❌ Lỗi lấy medical records:", error);
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu" });
  }
};

// ✅ Tải đơn thuốc dạng PDF (tuỳ chọn)
export const downloadPrescriptionPdf = async (req: Request, res: Response) => {
  // có thể giữ nguyên nếu bạn dùng PDFLib
  res.status(501).json({ message: "Chưa triển khai PDF" });
};

// ✅ Tạo sổ khám bệnh có tái khám và đơn thuốc
export const createMedicalRecordWithReExam = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      appointmentId,
      instructions,
      medications,
      reExamDate,
      description,
      note,
      doctorId,
      patientId,
    } = req.body;

    if (!appointmentId || !Array.isArray(medications)) {
      return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
    }

    // 👉 Tạo đơn thuốc
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        instructions,
      },
    });

    // 👉 Lưu danh sách thuốc
    for (const med of medications) {
      await prisma.medication.create({
        data: {
          ...med,
          prescriptionAppointmentId: appointmentId,
        },
      });
    }

    // 👉 Cập nhật prescription vào bảng Appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { prescription: { connect: { id: prescription.id } } },
    });

    // 👉 Tạo sổ khám bệnh
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        appointmentId,
        doctorId,
        patientId,
        description,
        note,
        date: new Date(),
        type: "history",
        reExamDate: reExamDate ? new Date(reExamDate) : null,
      },
    });

    res.json({ message: "Đã tạo sổ khám bệnh", medicalRecord });
  } catch (error) {
    console.error("❌ Lỗi tạo sổ khám bệnh:", error);
    res.status(500).json({ message: "Lỗi server khi tạo sổ khám bệnh" });
  }
};

// ✅ Lấy medical record theo id bệnh nhân (dành cho admin)
export const getMedicalRecordsByPatientId = async (
  req: Request,
  res: Response
) => {
  try {
    const patientId = Number(req.params.id);
    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });

    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        type: "history",
      },
      orderBy: { date: "desc" },
      include: {
        doctor: true,
        prescription: {
          include: { medications: true },
        },
        appointment: {
          include: { canLamSangs: true },
        },
      },
    });

    res.json(records);
  } catch (error) {
    console.error("❌ Lỗi lấy medical records theo ID:", error);
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu" });
  }
};
// GET: Hồ sơ bệnh của tất cả bệnh nhân mà bác sĩ từng khám
export const getMedicalRecordsByDoctor = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorId = (req as any).user?.doctorId;
    if (!doctorId)
      return res.status(403).json({ message: "Không có quyền truy cập" });

    const records = await prisma.medicalRecord.findMany({
      where: {
        doctorId,
        type: "history",
      },
      include: {
        patient: {
          select: {
            code: true,
            fullName: true,
            address: true,
          },
        },
        appointment: {
          select: {
            date: true,
            reExamDate: true,
            canLamSangs: {
              select: {
                id: true,
                type: true,
                result: true,
              },
            },
          },
        },
        prescription: {
          include: {
            medications: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json(records);
  } catch (error) {
    console.error("Lỗi lấy medical records của bác sĩ:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const updateMedicalRecord = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { note, reExamDate } = req.body;

  if (!id) return res.status(400).json({ message: "Thiếu ID hồ sơ" });

  try {
    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: {
        note,
        reExamDate: reExamDate ? new Date(reExamDate) : null,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("❌ Lỗi cập nhật hồ sơ:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật hồ sơ" });
  }
};
