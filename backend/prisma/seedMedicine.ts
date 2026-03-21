// prisma/seedMedicine.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const medicines = [
  {
    name: "Paracetamol 500mg",
    dosage: "500mg",
    unit: "viên",
    note: "Uống sau ăn",
    description: "Giảm đau, hạ sốt",
    price: 1000,
  },
  {
    name: "Amoxicillin 250mg",
    dosage: "250mg",
    unit: "viên",
    note: "Uống trước ăn 1 giờ",
    description: "Kháng sinh trị nhiễm khuẩn",
    price: 2500,
  },
  {
    name: "Loratadine 10mg",
    dosage: "10mg",
    unit: "viên",
    note: "Uống 1 viên/ngày",
    description: "Chống dị ứng",
    price: 1500,
  },
  {
    name: "Omeprazole 20mg",
    dosage: "20mg",
    unit: "viên",
    note: "Uống trước bữa ăn sáng",
    description: "Điều trị loét dạ dày, trào ngược",
    price: 3000,
  },
  {
    name: "Salbutamol 2mg",
    dosage: "2mg",
    unit: "viên",
    note: "Dùng khi khó thở",
    description: "Giãn phế quản",
    price: 1200,
  },
  {
    name: "Berberin 10mg",
    dosage: "10mg",
    unit: "viên",
    note: "Uống 2-4 viên/lần",
    description: "Trị tiêu chảy, nhiễm khuẩn đường ruột",
    price: 500,
  },
  {
    name: "Cetirizine 10mg",
    dosage: "10mg",
    unit: "viên",
    note: "Uống 1 viên/ngày vào buổi tối",
    description: "Chống dị ứng thế hệ 2",
    price: 1800,
  },
  {
    name: "Ibuprofen 400mg",
    dosage: "400mg",
    unit: "viên",
    note: "Uống sau ăn no",
    description: "Giảm đau, kháng viêm không steroid (NSAID)",
    price: 2000,
  },
  {
    name: "Aspirin 81mg",
    dosage: "81mg",
    unit: "viên",
    note: "Uống 1 viên/ngày sau ăn",
    description: "Chống kết tập tiểu cầu, phòng ngừa đột quỵ",
    price: 800,
  },
  {
    name: "Metformin 500mg",
    dosage: "500mg",
    unit: "viên",
    note: "Uống cùng bữa ăn",
    description: "Điều trị đái tháo đường type 2",
    price: 2200,
  },
];

async function main() {
  console.log("Bắt đầu quá trình seed Medicine...");
  
  // ✅ Xóa các bản ghi liên quan trước
  console.log("Đang xóa PrescriptionItem...");
  await prisma.prescriptionItem.deleteMany({});
  
  // ✅ Sau đó mới xóa Medicine
  console.log("Đang xóa Medicine...");
  await prisma.medicine.deleteMany({});

  console.log("Đang tạo dữ liệu Medicine mới...");
  for (const med of medicines) {
    await prisma.medicine.create({
      data: med,
    });
  }
  console.log("✅ Seed Medicine thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed Medicine:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
