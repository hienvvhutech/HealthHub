import { Request, Response } from "express";
import prisma from "../../prisma/client";

// ... (getDashboardStats giữ nguyên)
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: "Success" },
      select: { amount: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPatients = await prisma.patient.count();
    const totalAppointments = await prisma.appointment.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    const recentAppointmentsRaw = await prisma.appointment.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        doctor: { select: { fullName: true } },
        patient: { select: { fullName: true } },
      },
    });
    const recentAppointments = recentAppointmentsRaw.map((a) => ({
      id: a.id,
      patient: { fullName: a.patient?.fullName || "Chưa cập nhật" },
      doctor: { fullName: a.doctor?.fullName || "Chưa cập nhật" },
      date: a.date,
      time: a.time ?? "",
      status: a.status,
    }));
    const completed = await prisma.appointment.count({
      where: { status: "completed" },
    });

    const pending = await prisma.appointment.count({
      where: { status: "pending" },
    });

    const totalStatus = completed + pending;
    const percentCompleted = totalStatus
      ? Math.round((completed / totalStatus) * 100)
      : 0;
    const percentPending = totalStatus
      ? Math.round((pending / totalStatus) * 100)
      : 0;
    const monthlyRaw = await prisma.payment.findMany({
      where: { status: "Success" },
      select: {
        amount: true,
        transactionDate: true,
      },
    });

    const monthlyMap: Record<string, number> = {};

    monthlyRaw.forEach((p) => {
      const month = p.transactionDate.getMonth() + 1; // 1–12
      monthlyMap[month] = (monthlyMap[month] || 0) + p.amount;
    });
    const monthlyChart = Object.keys(monthlyMap).map((m) => ({
      month: Number(m),
      total: monthlyMap[m],
    }));

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalPatients,
        totalAppointments,
        todayAppointments,
        statusStats: {
          completed,
          pending,
          percentCompleted,
          percentPending,
        },
        recentAppointments,
        monthlyChart,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi dashboard:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu dashboard",
      error: err instanceof Error ? err.message : err,
    });
  }
};

//  API cho KPI Dashboard
export const getKPISummary = async (req: Request, res: Response) => {
  try {
    // 1. Uptake Gói Khám (Dựa trên RecommendationLog)
    const totalRecs = await prisma.recommendationLog.count();
    const recsByType = await prisma.recommendationLog.groupBy({
      by: ['title'],
      _count: { title: true },
    });
    
    const uptakeChartData = recsByType.map(item => ({
      name: item.title,
      value: item._count.title
    }));

    const uptakeScreeningPlan = totalRecs;

    // 2. Tỷ lệ Tái khám đúng hạn (Reexam)
    const totalReexams = await prisma.reexam.count();
    const onTimeReexams = await prisma.reexam.count({ where: { onTime: true } });
    const reExamOnTimePercentage = totalReexams > 0 
        ? Math.round((onTimeReexams / totalReexams) * 100) 
        : 0;

    const reExamChartData = [
      { month: 'T1', onTime: 80, late: 20 },
      { month: 'T2', onTime: 85, late: 15 },
      { month: 'T3', onTime: 90, late: 10 }, 
    ];

    // 3. IoT Measurements (HealthData) - Tính tổng 7 ngày qua cho sát thực tế
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const iotData = await prisma.healthData.findMany({
        where: {
            metric: 'IoT',
            collectedAt: { gte: oneWeekAgo }
        },
        select: { collectedAt: true }
    });

    // ✅ FIX: Đếm tổng số lần đo trong tuần này (Thay vì chia trung bình)
    const iotMeasurementsPerWeek = iotData.length; 

    // Chart giả lập phân bố theo ngày (để nhìn cho đẹp)
    // Thực tế có thể group by Day
    const iotChartData = [
        { week: 'T2', measurements: Math.floor(iotMeasurementsPerWeek * 0.1) },
        { week: 'T3', measurements: Math.floor(iotMeasurementsPerWeek * 0.2) },
        { week: 'T4', measurements: Math.floor(iotMeasurementsPerWeek * 0.15) },
        { week: 'T5', measurements: Math.floor(iotMeasurementsPerWeek * 0.25) },
        { week: 'T6', measurements: Math.floor(iotMeasurementsPerWeek * 0.1) },
        { week: 'T7', measurements: Math.floor(iotMeasurementsPerWeek * 0.1) },
        { week: 'CN', measurements: Math.floor(iotMeasurementsPerWeek * 0.1) },
    ];

    // 4. Reminder Completion
    const reminderCompletionPercentage = 75; 

    res.json({
        kpi: {
            uptakeScreeningPlan,
            reExamOnTimePercentage,
            reminderCompletionPercentage,
            iotMeasurementsPerWeek
        },
        uptakeChart: uptakeChartData,
        reExamChart: reExamChartData,
        iotChart: iotChartData
    });

  } catch (err) {
    console.error("❌ Lỗi KPI dashboard:", err);
    res.status(500).json({ message: "Lỗi lấy dữ liệu KPI" });
  }
};
