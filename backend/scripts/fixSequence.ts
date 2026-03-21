import prisma from "../src/utils/prismaClient";

async function fixSequenceNumbers() {
  const doctors = await prisma.doctor.findMany();

  for (const doctor of doctors) {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          not: "cancelled",
        },
      },
      orderBy: { date: "asc" },
    });

    for (let i = 0; i < appointments.length; i++) {
      await prisma.appointment.update({
        where: { id: appointments[i].id },
        data: { sequenceNumber: i + 1 },
      });
    }

    console.log(`✅ Cập nhật xong số thứ tự cho bác sĩ ID ${doctor.id}`);
  }

  console.log("🎉 Hoàn tất cập nhật tất cả số thứ tự.");
}

fixSequenceNumbers()
  .catch((err) => console.error("❌ Lỗi:", err))
  .finally(() => prisma.$disconnect());
