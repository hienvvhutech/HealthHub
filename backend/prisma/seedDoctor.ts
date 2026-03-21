import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const specialtiesList = [
  "Tim mạch",
  "Da liễu",
  "Nhi khoa",
  "Nội tổng quát",
  "Ngoại khoa",
  "Sản phụ khoa",
  "Tai Mũi Họng",
  "Răng Hàm Mặt",
  "Thần kinh",
  "Tiêu hóa",
  "Cơ xương khớp",
  "Mắt",
  "Ung bướu",
  "Hô hấp",
  "Nội tiết"
];

function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, "");
}

async function main() {
  console.log("🔄 Bắt đầu seed Bác sĩ và Chuyên khoa (Mở rộng)...");

  const hashedPassword = await bcrypt.hash("doctor123", 10);

  // 1. Tạo Chuyên khoa và Bác sĩ cho từng khoa
  for (const name of specialtiesList) {
    const spec = await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name }, // Removed description
    });

    // Tạo 2 bác sĩ cho mỗi khoa (Tự động)
    for (let i = 1; i <= 2; i++) {
        const slug = convertToSlug(name);
        const email = `bs.${slug}.${i}@healthhub.com`;
        
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                role: "doctor",
            },
        });

        await prisma.doctor.upsert({
            where: { userId: user.id },
            update: { specialtyId: spec.id },
            create: {
                userId: user.id,
                fullName: `BS. ${name} ${i}`,
                email,
                phone: `09${Math.floor(Math.random() * 100000000)}`,
                specialtyId: spec.id,
                experience: Math.floor(Math.random() * 20) + 5,
                hospital: "Bệnh viện Đa khoa HealthHub",
                bio: `Chuyên gia về ${name} với nhiều năm kinh nghiệm.`,
                // Removed gender
            },
        });
    }
  }

  // 2. Danh sách bác sĩ mẫu (Giữ lại để đảm bảo dữ liệu cũ không mất hoặc cho demo cụ thể)
  const doctorsData = [
    { name: "Nguyễn Văn A", email: "bs.a@healthhub.com", specIndex: 0 }, // Tim mạch
    { name: "Trần Thị B", email: "bs.b@healthhub.com", specIndex: 1 },   // Da liễu
    { name: "Lê Văn C", email: "bs.c@healthhub.com", specIndex: 2 },     // Nhi
    { name: "Phạm Thị D", email: "bs.d@healthhub.com", specIndex: 3 },   // Nội
    { name: "Hoàng Văn E", email: "bs.e@healthhub.com", specIndex: 4 },  // Ngoại
    { name: "Vũ Thị F", email: "bs.f@healthhub.com", specIndex: 5 },     // Sản
  ];

  const allSpecs = await prisma.specialty.findMany();
  
  for (const doc of doctorsData) {
    const targetSpecName = specialtiesList[doc.specIndex];
    const targetSpec = allSpecs.find(s => s.name === targetSpecName);
    
    if (targetSpec) {
        const user = await prisma.user.upsert({
        where: { email: doc.email },
        update: {},
        create: {
            email: doc.email,
            password: hashedPassword,
            role: "doctor",
        },
        });

        await prisma.doctor.upsert({
        where: { userId: user.id },
        update: { specialtyId: targetSpec.id },
        create: {
            userId: user.id,
            fullName: `BS. ${doc.name}`,
            email: doc.email,
            phone: "0900000000",
            specialtyId: targetSpec.id,
            experience: 10,
            hospital: "Bệnh viện Đa khoa HealthHub",
            bio: `Chuyên gia hàng đầu về ${targetSpec.name}.`,
        },
        });
    }
  }

  console.log("✅ Seed Bác sĩ hoàn tất!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
