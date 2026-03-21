import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@healthhub.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existingAdmin) {
    console.log("✅ Admin đã tồn tại.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Tài khoản admin mặc định đã được tạo.");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
