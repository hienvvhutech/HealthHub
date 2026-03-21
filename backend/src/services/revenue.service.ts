import prisma from "../../prisma/client";

export const getRevenueStats = async () => {
  // Tổng số lịch hẹn
  const totalAppointments = await prisma.appointment.count();

  // Số lịch hoàn thành
  const completedAppointments = await prisma.appointment.count({
    where: { status: "Completed" },
  });

  // Số tái khám
  const reExaminations = await prisma.appointment.count({
    where: { reExamDate: { not: null } },
  });

  // Tỷ lệ tái khám (%)
  const reExamRate =
    totalAppointments > 0
      ? ((reExaminations / totalAppointments) * 100).toFixed(2)
      : "0";

  // Tổng doanh thu (dựa trên bảng Payment)
  const payments = await prisma.payment.findMany({
    where: { status: "Success" },
    select: { amount: true },
  });
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Doanh thu theo tháng
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

  return {
    totalAppointments,
    completedAppointments,
    reExaminations,
    reExamRate,
    totalRevenue,
    monthlyRevenue: formattedMonthly,
  };
};
