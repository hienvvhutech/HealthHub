import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const getRevenue = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Tổng số lịch hẹn
    const totalAppointments = await prisma.appointment.count();

    // 2️⃣ Số cuộc hẹn hoàn thành
    const completedAppointments = await prisma.appointment.count({
      where: { status: "Completed" },
    });

    // 3️⃣ Số cuộc hẹn có tái khám
    const reExaminations = await prisma.appointment.count({
      where: { reExamDate: { not: null } },
    });

    // 4️⃣ Tỷ lệ tái khám (%)
    const reExamRate =
      totalAppointments > 0
        ? ((reExaminations / totalAppointments) * 100).toFixed(2)
        : "0";

    // 5️⃣ Tổng doanh thu (ưu tiên lấy theo bảng Payment)
    const payments = await prisma.payment.findMany({
      where: { status: "Success" },
      select: { amount: true },
    });

    const totalRevenue =
      payments.length > 0
        ? payments.reduce((sum, p) => sum + p.amount, 0)
        : totalAppointments * 200000; // fallback nếu chưa có dữ liệu Payment

    // 6️⃣ Doanh thu theo tháng
    const monthlyRevenue = await prisma.payment.groupBy({
      by: ["transactionDate"],
      _sum: { amount: true },
    });

    const formattedMonthly = monthlyRevenue.map((r) => ({
      month: r.transactionDate.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      total: r._sum.amount ?? 0,
    }));

    // ✅ Trả dữ liệu KPI
    res.json({
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        reExaminations,
        reExamRate,
        totalRevenue,
        monthlyRevenue: formattedMonthly,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tính doanh thu:", error);
    res.status(500).json({
      message: "Lỗi server khi tính doanh thu",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
// Tính % tái khám đúng hạn
export const getReexamRate = async (req: Request, res: Response) => {
  const total = await prisma.appointment.count();
  const onTime = await prisma.reexam.count({ where: { onTime: true } });
  const percent = ((onTime / total) * 100).toFixed(2);
  res.json({ total, onTime, percent });
};
