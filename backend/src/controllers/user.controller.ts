import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng." });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({ message: "Cập nhật vai trò thành công", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    await prisma.user.delete({ where: { id } });

    res.json({ message: "Xóa người dùng thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};
