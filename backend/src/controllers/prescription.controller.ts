import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const createPrescription = async (req: Request, res: Response) => {
  // Nhận thêm patientId, doctorId để tạo MedicalRecord nếu chưa có
  const { appointmentId, instructions, medications, patientId, doctorId } = req.body;

  try {
    console.log("💊 Saving Prescription for Appointment:", appointmentId);

    // 1. Xử lý Prescription (Upsert Logic thủ công vì quan hệ phức tạp)
    let prescription = await prisma.prescription.findUnique({
      where: { appointmentId },
    });

    if (prescription) {
      // Nếu đã có: Cập nhật hướng dẫn và xóa thuốc cũ để thêm mới
      await prisma.medication.deleteMany({
        where: { prescriptionId: prescription.id },
      });
      
      prescription = await prisma.prescription.update({
        where: { id: prescription.id },
        data: {
          instructions,
          medications: {
            create: medications,
          },
        },
        include: { medications: true },
      });
    } else {
      // Nếu chưa có: Tạo mới
      prescription = await prisma.prescription.create({
        data: {
          appointmentId,
          instructions,
          medications: {
            create: medications,
          },
        },
        include: { medications: true },
      });
    }

    // 2. Xử lý MedicalRecord (Đảm bảo luôn có hồ sơ bệnh án)
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { appointmentId },
    });

    if (existingRecord) {
      // Nếu đã có hồ sơ: Link đơn thuốc vào
      await prisma.medicalRecord.update({
        where: { id: existingRecord.id },
        data: { 
          prescriptionId: prescription.id,
          type: "history" // Đảm bảo hiện bên patient
        },
      });
    } else {
      // Nếu chưa có hồ sơ: Tạo mới ngay
      await prisma.medicalRecord.create({
        data: {
          appointmentId,
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          type: "history",
          description: "Khám bệnh & Kê đơn",
          date: new Date(),
          note: "Đã kê đơn thuốc",
          prescriptionId: prescription.id,
        },
      });
    }
    
    // 3. Cập nhật trạng thái Appointment thành 'completed' (hoặc 'examining') để flow trôi chảy
    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'completed' }
    });

    res.status(200).json(prescription);
  } catch (error) {
    console.error("❌ Lỗi tạo đơn thuốc:", error);
    res.status(500).json({ message: "Không thể tạo đơn thuốc" });
  }
};

export const getPrescriptionsByPatient = async (
  req: Request,
  res: Response
) => {
  const patientId = Number(req.params.id);

  try {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        appointment: {
          patientId,
        },
      },
      include: {
        medications: true,
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Lỗi khi lấy đơn thuốc:", error);
    res.status(500).json({ message: "Không thể lấy đơn thuốc" });
  }
};
