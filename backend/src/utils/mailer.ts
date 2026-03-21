import nodemailer from "nodemailer";
import "dotenv/config";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendReExamEmail = async (
  to: string,
  doctor: string,
  date: string,
  time: string
) => {
  await transporter.sendMail({
    from: `"HealthHub" <systemhealthhub@gmail.com>`,
    to,
    subject: "📋 Xác nhận tái khám thành công",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2 style="color: #3b82f6;">HealthHub - Xác nhận tái khám</h2>
        <p>Xin chào,</p>
        <p>Bạn đã xác nhận sẽ đến tái khám với:</p>
        <ul>
          <li><strong>Bác sĩ:</strong> ${doctor}</li>
          <li><strong>Thời gian:</strong> ${date} lúc ${time}</li>
        </ul>
        <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>
        <p>Trân trọng,<br><strong>HealthHub Team</strong></p>
      </div>
    `,
  });
};
