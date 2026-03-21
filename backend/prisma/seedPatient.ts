import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Bắt đầu seed bệnh nhân...');

  // Lấy userId của tài khoản admin@healthhub.com hoặc user đầu tiên được tạo
  const patientUser = await prisma.user.findFirst({
    where: { role: 'patient' }, // Tìm user có role là patient
    orderBy: { id: 'asc' }, // Lấy user đầu tiên (có ID nhỏ nhất)
  });

  if (!patientUser) {
    console.warn('⚠️ Không tìm thấy User với role patient. Vui lòng đảm bảo User đã được seed trước.');
    return;
  }

  // Kiểm tra nếu bệnh nhân đã tồn tại cho userId này
  const existingPatient = await prisma.patient.findFirst({
    where: { userId: patientUser.id },
  });

  if (existingPatient) {
    console.log(`✅ Bệnh nhân cho User ID ${patientUser.id} đã tồn tại, bỏ qua tạo mới.`);
    return;
  }

  await prisma.patient.create({
    data: {
      userId: patientUser.id,
      fullName: 'Nguyễn Thị Bệnh Nhân',
      email: patientUser.email, 
      phone: '0912345678',
      address: '456 Đường Sức Khỏe, TP.HCM',
      dob: new Date('1995-03-20'),
      gender: 'Female',
      bloodType: 'B+',
      height: 160,
      weight: 55,
      avatarUrl: 'https://example.com/patient-avatar-female.jpg', 
    },
  });

  // Thêm một bệnh nhân khác cho userId 10 (theo token bạn cung cấp)
  const userFromToken = await prisma.user.findUnique({
    where: { id: 10 }, 
  });

  if (userFromToken && !await prisma.patient.findFirst({ where: { userId: userFromToken.id } })) {
    await prisma.patient.create({
      data: {
        userId: userFromToken.id,
        fullName: 'Lê Văn Token',
        email: userFromToken.email,
        phone: '0900112233',
        address: '789 Đường Chat, TP.HCM',
        dob: new Date('1988-07-07'),
        gender: 'Male',
        bloodType: 'O-',
        height: 175,
        weight: 70,
        avatarUrl: 'https://example.com/patient-avatar-token.jpg',
      },
    });
    console.log(`✅ Đã seed bệnh nhân cho User ID ${userFromToken.id} thành công.`);
  }

  console.log('✅ Hoàn tất seed bệnh nhân.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed bệnh nhân:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
