//cspell:disable
import { Request, Response } from "express";
import prisma from "../../prisma/client";
import nodemailer from "nodemailer";

// ✅ Cố định danh sách khung giờ để tính STT (Khớp với Frontend)
const FIXED_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00"
];

// ... (các hàm khác giữ nguyên)
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, note, email } = req.body;
    const user = (req as any).user;
    const userId = user.id; // Lấy userId từ token
    const patientId = user.patientId;

    if (!patientId || !doctorId || !date || !email) {
      res.status(400).json({ message: "Thiếu thông tin đặt lịch" });
      return;
    }

    const appointmentDate = new Date(date);

    // Kiểm tra lịch trùng
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: appointmentDate,
        status: { in: ["pending", "waiting", "examining", "completed"] },
      },
    });

    if (existing) {
      res.status(400).json({
        message: "Bác sĩ đã có lịch vào giờ này. Vui lòng chọn giờ khác.",
      });
      return;
    }
    
    // Tính STT dựa trên slot
    const vnDate = new Date(appointmentDate.getTime() + 7 * 60 * 60 * 1000);
    const hour = vnDate.getUTCHours().toString().padStart(2, '0');
    const minute = vnDate.getUTCMinutes().toString().padStart(2, '0');
    const timeStr = `${hour}:${minute}`;

    let sequenceNumber = FIXED_SLOTS.indexOf(timeStr) + 1;

    // Nếu không thuộc slot cố định, tính theo số lượng
    if (sequenceNumber === 0) {
       const startOfDay = new Date(appointmentDate);
       startOfDay.setHours(0, 0, 0, 0);
       const countBefore = await prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: startOfDay, lt: appointmentDate },
            status: { in: ["pending", "waiting", "examining", "completed"] },
          },
        });
        sequenceNumber = countBefore + 1;
    }
    
    // --- START LOGIC ƯU TIÊN ---
    // 1. Kiểm tra tuổi bệnh nhân
    const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { dob: true }
    });
    
    let isPriority = false;
    let priorityReason = "";

    if (patient && patient.dob) {
        const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
        if (age >= 65) {
            isPriority = true;
            priorityReason = "Người cao tuổi";
        }
    }

    // 2. Kiểm tra chỉ số IoT bất thường gần đây (trong vòng 24h)
    const recentIoT = await prisma.healthData.findFirst({
        where: {
            patientId,
            metric: "IoT",
            collectedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        orderBy: { collectedAt: 'desc' }
    });

    if (recentIoT) {
        try {
            const data = JSON.parse(recentIoT.value);
            if (data.bloodPressure > 140 || data.heartRate > 120 || data.glucose > 180) {
                isPriority = true;
                priorityReason = priorityReason ? `${priorityReason}, Chỉ số sức khỏe cao` : "Chỉ số sức khỏe cao (IoT)";
            }
        } catch (e) { /* ignore parse error */ }
    }

    let finalNote = note || "";
    if (isPriority) {
        finalNote = `[ƯU TIÊN: ${priorityReason}] ${finalNote}`;
    }
    // --- END LOGIC ƯU TIÊN ---

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: appointmentDate,
        note: finalNote,
        status: "pending",
        sequenceNumber,
        isVisibleForDoctor: true,
      },
      include: { doctor: true },
    });

    const io = req.app.get("io");

    // ✅ TẠO THÔNG BÁO: Đặt lịch thành công (Hiện ngay)
    const successNotif = await prisma.notification.create({
        data: {
            userId: userId,
            title: "Đặt lịch thành công ✅",
            message: `Lịch hẹn #${appointment.id} với BS. ${appointment.doctor.fullName} đã được tạo. Vui lòng thanh toán để xác nhận.`,
            type: "Appointment",
            status: "Unread",
            scheduledAt: new Date() // Hiện ngay
        }
    });
    if (io) {
        io.to(`user-${userId}`).emit("newNotification", successNotif);
    }

    // --- START: Logic tạo thông báo hẹn trước (15-30 phút) ---
    // Tính toán thời gian thông báo
    const notificationTime = new Date(appointmentDate.getTime() - 20 * 60 * 1000); // 20 phút trước cuộc hẹn
    
    // Kiểm tra xem ngày hẹn có phải là hôm nay không
    const isToday = new Date().toDateString() === appointmentDate.toDateString();
    
    // Định dạng chuỗi ngày tháng hiển thị trong tin nhắn
    const dateString = isToday 
        ? "hôm nay" 
        : `ngày ${appointmentDate.toLocaleDateString("vi-VN")}`;
    
    const timeString = new Date(appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (notificationTime > new Date()) { // Chỉ tạo nếu thời gian thông báo còn trong tương lai
        await prisma.notification.create({
            data: {
                userId: userId, // userId của bệnh nhân
                title: "Lịch hẹn sắp tới",
                message: `Bạn có lịch hẹn với Bác sĩ ${appointment.doctor.fullName} vào lúc ${timeString} ${dateString}.`, 
                type: "appointment_reminder",
                status: "Unread",
                scheduledAt: notificationTime,
            },
        });
    }
    // --- END: Logic tạo thông báo hẹn trước ---

    const code = `APPT-${appointment.id}-${Date.now()}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    const mailOptions = {
      from: "yourclinicemail@gmail.com",
      to: email,
      subject: "Mã đặt lịch khám bệnh",
      text: `Cảm ơn bạn đã đặt lịch khám tại HealthHub.\nMã đặt lịch của bạn là: ${code}\nThời gian khám: ${appointmentDate.toLocaleString()}\nSố thứ tự: ${sequenceNumber}\n${isPriority ? 'Bạn được đánh dấu ƯU TIÊN.' : ''}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ ...appointment, code, isPriority, priorityReason });
  } catch (error) {
    console.error("Lỗi khi tạo lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server khi tạo lịch hẹn" });
  }
};

export const updateAppointmentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const appointmentId = parseInt(req.params.id);
  const { status, reExamDate, note } = req.body;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: { include: { user: true } }, doctor: true } // Thêm include để lấy thông tin user của patient
    });

    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status,
        note: note || undefined,
        reExamDate: reExamDate ? new Date(reExamDate) : undefined,
      },
    });

    // ✅ SOCKET.IO: Emit update event
    const io = req.app.get("io");
    if (io) {
        io.emit("appointmentStatusUpdated", updated);
        // Also emit to specific queue room if implemented
        io.emit("queueUpdate", { doctorId: appointment.doctorId });

        // --- START: Logic thông báo NGƯỜI TIẾP THEO (N+1) ---
        // Khi bác sĩ chuyển trạng thái 1 người sang "examining" (Đang khám)
        if (status === "examining") { 
            const appointmentsForDoctorToday = await prisma.appointment.findMany({
                where: {
                    doctorId: appointment.doctorId,
                    date: { 
                        gte: new Date(new Date().setHours(0,0,0,0)),
                        lte: new Date(new Date().setHours(23,59,59,999))
                    },
                    status: { in: ["pending", "waiting", "examining"] }
                },
                orderBy: { sequenceNumber: "asc" }
            });

            const currentAppointmentIndex = appointmentsForDoctorToday.findIndex((a: any) => a.id === updated.id);
            
            // ✅ SỬA LOGIC: Nhắc người KẾ TIẾP (index + 1)
            if (currentAppointmentIndex !== -1 && appointmentsForDoctorToday.length > currentAppointmentIndex + 1) {
                const nextPatientAppointment = appointmentsForDoctorToday[currentAppointmentIndex + 1];
                
                if (nextPatientAppointment) {
                  const patientUser = await prisma.patient.findUnique({
                    where: { id: nextPatientAppointment.patientId },
                    select: { userId: true, fullName: true }
                  });
                  
                  if (patientUser) {
                    const queueNotif = await prisma.notification.create({
                        data: {
                            userId: patientUser.userId, 
                            title: "SẮP ĐẾN LƯỢT BẠN 🔔",
                            message: `Mời bệnh nhân ${patientUser.fullName} (Số ${nextPatientAppointment.sequenceNumber}) chuẩn bị vào phòng khám BS ${appointment.doctor.fullName}. Bác sĩ đang khám cho số ${updated.sequenceNumber}.`, 
                            type: "queue_reminder",
                            status: "Unread",
                            scheduledAt: new Date(), // Gửi ngay
                        },
                    });
                    // Emit socket
                    io.to(`user-${patientUser.userId}`).emit("newNotification", queueNotif);
                  }
                }
            }
        }
        // --- END: Logic thông báo ---
    }

    if (reExamDate || status === "completed") {
      const existingRecord = await prisma.medicalRecord.findUnique({
         where: { appointmentId }
      });
      const reExamDateTime = reExamDate ? new Date(reExamDate) : null;

      if (existingRecord) {
        await prisma.medicalRecord.update({
          where: { id: existingRecord.id },
          data: { 
            reExamDate: reExamDateTime, 
            note: note || existingRecord.note,
            type: "history"
          }
        });
      } else {
        await prisma.medicalRecord.create({
          data: {
            appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            type: "history",
            description: "Kết quả khám bệnh",
            date: new Date(), 
            reExamDate: reExamDateTime,
            note: note || "Đã hoàn thành khám",
          }
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ Lỗi update:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getAllAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        patient: true, 
        doctor: {
          include: { specialty: true } 
        } 
      },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lịch hẹn" });
  }
};

export const getPatientsByDoctor = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const doctorId = parseInt(req.params.id);
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: { patient: true },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy bệnh nhân theo bác sĩ" });
  }
};

export const getAppointmentsByPatient = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const user = (req as any).user;
  const patientId = user.patientId;
  const requestedPatientId = parseInt(req.params.id);

  if (patientId !== requestedPatientId) {
    res.status(403).json({ message: "Bạn không có quyền xem lịch hẹn của người khác" });
    return;
  }
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: "desc" },
      include: { doctor: true },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử khám" });
  }
};

export const getAppointmentsForPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const patientId = user.patientId;
    if (!patientId) {
      res.status(400).json({ error: "Không tìm thấy patientId" });
      return;
    }
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: { in: ["pending", "examining", "waiting", "confirmed"] },
      },
      include: { doctor: true },
      orderBy: { date: "asc" },
    });
    const result = appointments.map((a: any) => ({
      id: a.id,
      date: a.date,
      note: a.note,
      status: a.status,
      sequenceNumber: a.sequenceNumber,
      doctorName: a.doctor?.fullName ?? "Không rõ",
      doctor: a.doctor,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy lịch hẹn" });
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: "cancelled" },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi huỷ lịch" });
  }
};

export const getAppointmentsForDoctor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date } = req.query; // ✅ Lấy date từ query

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ tương ứng" });
    }

    // ✅ Xây dựng điều kiện lọc động
    const whereCondition: any = {
      doctorId: doctor.id,
      isVisibleForDoctor: true,
    };

    if (date && typeof date === 'string') {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      whereCondition.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereCondition,
      include: {
        patient: true,
        medicalRecord: true,
        canLamSangs: true,
        prescription: { include: { medications: true } },
      },
      orderBy: { date: "asc" },
    });

    res.json(appointments);
  } catch (error) {
    console.error("Lỗi khi lấy lịch hẹn cho bác sĩ:", error);
    res.status(500).json({ message: "Lỗi server khi lấy lịch" });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { specialty: true } },
        canLamSangs: true,
        prescription: { include: { medications: true } },
      },
    });
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    res.json({ ...appointment, specialtyId: appointment.doctor?.specialtyId || null });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy lịch hẹn" });
  }
};

export const hideAppointmentFromDoctor = async (req: Request, res: Response) => {
  const appointmentId = parseInt(req.params.id);
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    if (appointment.status !== "completed" && appointment.status !== "cancelled") {
      return res.status(400).json({ message: "Chỉ ẩn được lịch đã khám hoặc đã huỷ" });
    }
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { isVisibleForDoctor: false },
    });
    res.json({ message: "Đã ẩn lịch khỏi giao diện bác sĩ" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi ẩn lịch" });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.medication.deleteMany({ where: { prescription: { appointmentId: id } } });
    await prisma.canLamSang.deleteMany({ where: { appointmentId: id } });
    await prisma.medicalRecord.deleteMany({ where: { appointmentId: id } });
    await prisma.prescription.deleteMany({ where: { appointmentId: id } });
    await prisma.appointment.delete({ where: { id } });
    res.status(200).json({ message: "Xoá lịch hẹn thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xoá lịch hẹn", error });
  }
};

export const getQueueStatus = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const doctors = await prisma.doctor.findMany({
      include: {
        specialty: true,
        appointments: {
          where: {
            date: { gte: todayStart, lte: todayEnd },
            status: { in: ["pending", "waiting", "examining", "completed"] },
          },
          orderBy: { sequenceNumber: "asc" },
        },
      },
    });

    const data = doctors.map((doc: any) => {
      const currentAppointment = doc.appointments.find((a: any) => a.status === "examining");
      const nextAppointment = doc.appointments.find((a: any) => a.status === "pending" || a.status === "waiting");
      const displaySequence = currentAppointment?.sequenceNumber || nextAppointment?.sequenceNumber || 0;
      const displayStatus = currentAppointment ? "Đang khám" : (nextAppointment ? "Mời vào khám" : "Chưa hoạt động");

      let nextTime = "--:--";
      if (currentAppointment?.date) {
        const estimate = new Date(currentAppointment.date);
        estimate.setMinutes(estimate.getMinutes() + 30);
        nextTime = estimate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      } else if (nextAppointment?.date) {
          nextTime = new Date(nextAppointment.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }

      return {
        specialty: doc.specialty?.name || "Không rõ",
        doctor: "BS. " + doc.fullName,
        currentNumber: displaySequence,
        nextNumber: nextAppointment?.sequenceNumber || null,
        statusText: displayStatus,
        nextTime,
      };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy hàng đợi" });
  }
};

export const getBookedTimes = async (req: Request, res: Response) => {
  const { doctorId, start, end } = req.query;
  if (!doctorId || !start || !end) return res.status(400).json({ message: "Thiếu tham số" });

  const startDate = new Date(String(start));
  const endDate = new Date(String(end));

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: Number(doctorId),
      date: { gte: startDate, lte: endDate }, 
      status: { in: ["pending", "waiting", "examining", "completed"] },
    },
    select: { date: true }, 
  });
  const bookedTimes = appointments.map((a: any) => a.date.toISOString()); 
  res.json({ bookedTimes });
};

// ✅ CHECK-IN (Patient)
export const checkInAppointment = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = (req as any).user;
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    
    // Check ownership
    if (appointment.patientId !== user.patientId) {
        return res.status(403).json({ message: "Bạn không có quyền thao tác lịch hẹn này" });
    }
    
    // ✅ CHECK DATE: Chỉ cho phép check-in nếu là ngày hẹn
    const now = new Date();
    const apptDate = new Date(appointment.date);
    
    // Reset giờ để so sánh ngày
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const apptDateStr = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate()).toDateString();

    if (todayStr !== apptDateStr) {
        return res.status(400).json({ 
            message: `Chưa đến ngày hẹn. Vui lòng quay lại vào ngày ${apptDate.toLocaleDateString('vi-VN')}.` 
        });
    }

    // Only allow check-in if pending or confirmed
    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
        return res.status(400).json({ message: "Trạng thái không hợp lệ để check-in" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "waiting" },
    });
    
    // Socket update
    const io = req.app.get("io");
    if (io) {
        io.emit("appointmentStatusUpdated", updated);
        io.emit("queueUpdate", { doctorId: appointment.doctorId });
    }

    res.json(updated);
  } catch (error) {
    console.error("Lỗi check-in:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
