import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { id: "asc" },
    });

    return res.status(200).json(medicines);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách thuốc:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách thuốc" });
  }
};
