import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { search } = req.query;

  try {
    const patients = await prisma.patient.findMany({
      where:
        typeof search === "string" && search.trim()
          ? {
              OR: [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : undefined,
    });

    res.status(200).json(patients);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách bệnh nhân." });
  }
};

export const createPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fullName, email, phone, address, dob, userId } = req.body;

  try {
    const newPatient = await prisma.patient.create({
      data: {
        fullName,
        email,
        phone,
        address,
        dob: dob ? new Date(dob) : undefined,
        user: {
          connect: { id: userId }, // 👈 Bắt buộc phải có dòng này
        },
      },
    });

    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi thêm bệnh nhân." });
  }
};

export const updatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id);
  const {
    fullName,
    email,
    phone,
    address,
    dob,
    gender,
    avatarUrl,
    height,
    weight,
    bloodType,
  } = req.body;

  try {
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        fullName,
        email,
        phone,
        address,
        gender,
        dob: dob ? new Date(dob) : undefined,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        bloodType,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật bệnh nhân." });
  }
};

export const deletePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id);

  try {
    await prisma.patient.delete({ where: { id } });
    res.json({ message: "Đã xoá bệnh nhân." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xoá bệnh nhân." });
  }
};

export const getPatientById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id);

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      res.status(404).json({ message: "Không tìm thấy bệnh nhân." });
      return;
    }

    res.json(patient);
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông tin bệnh nhân:", err);
    res.status(500).json({ message: "Lỗi server khi lấy hồ sơ." });
  }
};
export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  const patientId = parseInt(req.params.id);

  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: true,
        appointment: {
          include: {
            canLamSangs: true,
            prescription: {
              include: {
                medications: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Gắn prescription vào record để dùng cho frontend HealthDashboard
    const recordsWithPrescription = records.map((record) => ({
      ...record,
      prescription: record.appointment?.prescription || null,
      canLamSangs: record.appointment?.canLamSangs || [],
    }));

    res.json(recordsWithPrescription);
  } catch (error) {
    console.error("❌ Lỗi lấy sổ khám bệnh:", error);
    res.status(500).json({ message: "Lỗi khi lấy sổ khám bệnh", error });
  }
};
