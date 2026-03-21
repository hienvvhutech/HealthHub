// prisma/seedCLS.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clsTypes = [
  "Xét nghiệm máu tổng quát",
  "Xét nghiệm sinh hóa máu",
  "Xét nghiệm nước tiểu",
  "Siêu âm tổng quát",
  "Siêu âm tim",
  "X-Quang tim phổi",
  "X-Quang xương khớp",
  "Điện tâm đồ (ECG)",
  "Nội soi dạ dày",
  "CT Scanner",
  "MRI (Cộng hưởng từ)",
  "Đo chức năng hô hấp",
];

async function main() {
  console.log("🔄 Bắt đầu seed loại Cận lâm sàng (CLS)...");

  for (const name of clsTypes) {
    // Upsert để tránh trùng lặp nếu chạy nhiều lần
    // Tuy nhiên, model CLSType hiện tại không có @unique cho name?
    // Kiểm tra schema.prisma: model CLSType { id, name }
    // Nếu chưa có unique, upsert by name không được.
    // Nên dùng findFirst rồi create.
    
    const existing = await prisma.cLSType.findFirst({
      where: { name },
    });

    if (!existing) {
      await prisma.cLSType.create({
        data: { name },
      });
      console.log(`✅ Đã tạo: ${name}`);
    } else {
      console.log(`ℹ️ Đã tồn tại: ${name}`);
    }
  }

  console.log("✅ Seed CLS hoàn tất!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed CLS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
