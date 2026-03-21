import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET /api/payments/:appointmentId – Lấy thông tin thanh toán
export const getPaymentDetails = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;

  if (!appointmentId || isNaN(parseInt(appointmentId))) {
    return res.status(400).json({ message: "appointmentId không hợp lệ" });
  }

  const id = parseInt(appointmentId);

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    const baseFee = appointment.fee || 500000;

    res.json({
      appointmentId: id,
      fee: baseFee,
      sequenceNumber: appointment.sequenceNumber,
      doctor: appointment.doctor,
      date: appointment.date,
      specialty: appointment.specialty,
      time: appointment.time,
      total: baseFee,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết thanh toán:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thanh toán" });
  }
};

// ✅ POST /api/payments – Gửi thanh toán
interface PaymentBody {
  appointmentId: number;
  amount: number;
  paymentMethod: string;
}

export const createPayment = async (
  req: Request<{}, {}, PaymentBody>,
  res: Response
) => {
  const { appointmentId, amount, paymentMethod } = req.body;

  if (!appointmentId || !amount || !paymentMethod) {
    return res.status(400).json({ message: "Thiếu thông tin thanh toán" });
  }

  try {
    // 1️⃣ Lấy thông tin Appointment để biết Patient là ai
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(appointmentId) },
      include: { patient: { include: { user: true } } }
    });

    if (!appointment || !appointment.patient || !appointment.patient.user) {
        return res.status(404).json({ message: "Không tìm thấy thông tin bệnh nhân" });
    }

    // 2️⃣ Tạo bản ghi payment
    const payment = await prisma.payment.create({
      data: {
        appointmentId: Number(appointmentId),
        amount: Number(amount),
        method: paymentMethod,
        status: "Success",
        transactionDate: new Date(),
      },
    });

    // 3️⃣ Cập nhật appointment thành Waiting (Đã thanh toán, chờ khám)
    // Lưu ý: Status 'Completed' thường là Đã khám xong. Sau thanh toán nên là 'waiting'.
    await prisma.appointment.update({
      where: { id: Number(appointmentId) },
      data: { status: "waiting" },
    });

    // 4️⃣ ✅ TẠO THÔNG BÁO CHO USER
    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        title: "Thanh toán thành công ✅",
        message: `Bạn đã thanh toán ${amount.toLocaleString()} VND cho lịch hẹn #${appointmentId}. Vui lòng đến đúng giờ!`,
        type: "Payment",
        status: "Unread"
      }
    });

    console.log("💰 Thanh toán & Thông báo thành công:", payment);

    return res.status(201).json({
      success: true,
      message: "Thanh toán thành công",
      payment,
    });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý thanh toán:", error);
    return res.status(500).json({ message: "Lỗi khi xử lý thanh toán", error });
  }
};
