import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const getAllDoctors = async (req: Request, res: Response) => {
  const { search, specialty } = req.query;

  try {
    console.log("🔍 Nhận yêu cầu lấy danh sách bác sĩ:", { search, specialty });

    const filters: any[] = [];

    // Tìm kiếm theo từ khóa (Tên bác sĩ hoặc Tên chuyên khoa)
    if (typeof search === "string" && search.trim().length > 0) {
      filters.push({
        OR: [
          { fullName: { contains: search } },
          {
            specialty: {
              name: {
                contains: search,
              },
            },
          },
        ],
      });
    }

    // Lọc theo Chuyên khoa (Chính xác)
    if (typeof specialty === "string" && specialty.trim().length > 0) {
      filters.push({
        specialty: {
          name: {
            equals: specialty, // So khớp chính xác tên chuyên khoa
          },
        },
      });
    }

    const where = filters.length > 0 ? { AND: filters } : undefined;

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: true,
        specialty: true,
      },
    });

    const result = doctors.map((doctor: any) => ({
      id: doctor.id,
      fullName: doctor.fullName,
      email: doctor.email,
      dob: doctor.dob,
      specialty: doctor.specialty ? { name: doctor.specialty.name } : null,
      hospital: doctor.hospital,
      experience: doctor.experience,
      phone: doctor.phone,
      languages: doctor.languages,
      bio: doctor.bio,
    }));

    console.log(`🔍 Tìm thấy ${result.length} bác sĩ.`);
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi server khi lấy danh sách bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách bác sĩ" });
  }
};

export const getDoctorByMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  console.log("🔍 Nhận yêu cầu lấy thông tin bác sĩ, userId:", userId);

  if (!userId) {
    console.error("❌ Thiếu userId trong request");
    return res.status(400).json({ message: "Thiếu thông tin userId" });
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      console.error("❌ Không tìm thấy bác sĩ với userId:", userId);
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    console.log("🔍 Trả về thông tin bác sĩ:", doctor);
    res.json(doctor);
  } catch (err) {
    console.error("❌ Lỗi server khi lấy thông tin bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin bác sĩ" });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  const { fullName, email, dob, password, specialtyId } = req.body;

  console.log("🔍 Nhận yêu cầu tạo bác sĩ:", {
    fullName,
    email,
    dob,
    specialtyId,
  });

  if (!fullName || !email || !dob || !password || !specialtyId) {
    console.error("❌ Thiếu thông tin tạo bác sĩ:", {
      fullName,
      email,
      dob,
      password,
      specialtyId,
    });
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "doctor",
      },
    });

    const newDoctor = await prisma.doctor.create({
      data: {
        fullName,
        email,
        dob: new Date(dob),
        userId: newUser.id,
        specialtyId: Number(specialtyId),
      },
    });

    console.log("✅ Tạo bác sĩ thành công:", newDoctor);
    res
      .status(201)
      .json({ message: "Tạo bác sĩ thành công", doctor: newDoctor });
  } catch (err) {
    console.error("❌ Lỗi khi tạo bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server khi thêm bác sĩ" });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const {
    fullName,
    email,
    dob,
    password,
    specialtyId,
    hospital,
    phone,
    experience,
    languages,
    bio,
  } = req.body;

  console.log("🔍 Nhận yêu cầu cập nhật bác sĩ:", {
    id,
    fullName,
    email,
    dob,
    specialtyId,
    hospital,
    phone,
    experience,
    languages,
    bio,
  });

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  if (!fullName || !email || !dob) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  try {
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        fullName,
        email,
        dob: new Date(dob),
        specialtyId: specialtyId ? Number(specialtyId) : undefined,
        hospital: hospital || null,
        phone: phone || null,
        experience: experience ? Number(experience) : null,
        languages: languages || null,
        bio: bio || null,
      },
    });

    // ✅ Cập nhật mật khẩu nếu có
    if (password) {
      const doctor = await prisma.doctor.findUnique({ where: { id } });
      if (doctor) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { password: hashedPassword },
        });
      }
    }

    console.log("✅ Cập nhật bác sĩ thành công:", updatedDoctor);
    res.json({ message: "Cập nhật bác sĩ thành công", doctor: updatedDoctor });
  } catch (err) {
    console.error("❌ Lỗi server khi cập nhật bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật bác sĩ" });
  }
};

export const updateDoctorByMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { fullName, specialtyId, phone, hospital, experience, languages, bio } =
    req.body;

  console.log("🔍 Nhận yêu cầu cập nhật hồ sơ bác sĩ:", {
    userId,
    fullName,
    specialtyId,
    phone,
    hospital,
    experience,
    languages,
    bio,
  });

  if (!userId) {
    console.error("❌ Thiếu userId trong request");
    return res.status(400).json({ message: "Thiếu thông tin userId" });
  }

  if (!fullName) {
    console.error("❌ Thiếu thông tin bắt buộc:", { fullName });
    return res.status(400).json({ message: "Họ tên là bắt buộc" });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) {
      console.error("❌ Không tìm thấy bác sĩ với userId:", userId);
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        fullName,
        specialtyId: specialtyId ? Number(specialtyId) : null,
        phone,
        hospital,
        experience: isNaN(Number(experience)) ? null : Number(experience),
        languages,
        bio,
      },
    });

    console.log("✅ Đã cập nhật hồ sơ thành công:", updated);
    res.json({ message: "Đã cập nhật hồ sơ thành công", doctor: updated });
  } catch (err) {
    console.error("❌ Lỗi cập nhật bác sĩ:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật thông tin bác sĩ" });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  console.log("🔍 Nhận yêu cầu xóa bác sĩ, id:", id);

  if (!id || isNaN(id)) {
    console.error("❌ ID không hợp lệ:", id);
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    await prisma.doctor.delete({ where: { id } });
    console.log("✅ Đã xóa bác sĩ thành công, id:", id);
    res.json({ message: "Đã xóa bác sĩ thành công" });
  } catch (err) {
    console.error("❌ Lỗi server khi xóa bác sĩ:", err);
    res.status(500).json({ message: "Lỗi server khi xóa bác sĩ" });
  }
};

export const getAppointmentsByDoctorLogin = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user?.id;

  console.log("🔍 Nhận yêu cầu lấy lịch hẹn của bác sĩ, userId:", userId);

  if (!userId) {
    console.error("❌ Thiếu userId trong request");
    return res.status(400).json({ message: "Thiếu thông tin userId" });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) {
      console.error("❌ Không tìm thấy bác sĩ với userId:", userId);
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: true },
    });

    console.log("🔍 Trả về danh sách lịch hẹn:", appointments);
    res.json(appointments);
  } catch (err) {
    console.error("❌ Lỗi server khi lấy lịch hẹn:", err);
    res.status(500).json({ message: "Lỗi server khi lấy lịch hẹn" });
  }
};

export const deleteAppointmentByDoctor = async (
  req: Request,
  res: Response
) => {
  const appointmentId = parseInt(req.params.id);

  console.log("🔍 Nhận yêu cầu xóa lịch hẹn, appointmentId:", appointmentId);

  if (!appointmentId || isNaN(appointmentId)) {
    console.error("❌ ID lịch hẹn không hợp lệ:", appointmentId);
    return res.status(400).json({ message: "ID lịch hẹn không hợp lệ" });
  }

  try {
    await prisma.canLamSang.deleteMany({ where: { appointmentId } });
    await prisma.medicalRecord.deleteMany({ where: { appointmentId } });
    await prisma.appointment.delete({ where: { id: appointmentId } });

    console.log("✅ Đã xóa lịch hẹn thành công, id:", appointmentId);
    res.json({ message: "Đã xóa lịch hẹn thành công" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa lịch hẹn:", err);
    res.status(500).json({ message: "Lỗi khi xóa lịch hẹn" });
  }
};
