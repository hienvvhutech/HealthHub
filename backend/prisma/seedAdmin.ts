// prisma/seedAdmin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@healthhub.com";
  const password = "admin123";

  console.log(`Kiểm tra sự tồn tại của admin: ${email}...`);

  // Kiểm tra xem admin đã tồn tại chưa
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Tài khoản admin đã tồn tại. Bỏ qua seeding.");
    return;
  }

  // Mã hóa mật khẩu
  console.log("Mã hóa mật khẩu...");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo tài khoản admin mới
  console.log("Tạo tài khoản admin mới...");
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Seed admin thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
