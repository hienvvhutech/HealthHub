import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email đã được đăng ký." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "patient",
      },
    });

    // Nếu là bệnh nhân thì tạo thêm bảng Patient
    if (newUser.role === "patient") {
      try {
        await prisma.patient.create({
          data: {
            fullName: "Chưa cập nhật",
            email: newUser.email,
            userId: newUser.id,
          },
        });
      } catch (err) {
        console.error("Lỗi tạo Patient:", err);
        // Nếu lỗi, nên rollback user hoặc trả về lỗi luôn
        await prisma.user.delete({ where: { id: newUser.id } });
        res.status(500).json({ message: "Lỗi khi tạo Patient." });
        return;
      }
    }

    res.status(201).json({ message: "Đăng ký thành công", user: newUser });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "Tài khoản không tồn tại." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Mật khẩu không chính xác." });
      return;
    }

    let patientId = null;
    let doctorId = null;

    if (user.role === "patient") {
      const patient = await prisma.patient.findFirst({
        where: { userId: user.id },
      });
      if (patient) {
        patientId = patient.id;
      }
    }

    if (user.role === "doctor") {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user.id },
      });
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId,
        doctorId,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId,
        doctorId,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};
