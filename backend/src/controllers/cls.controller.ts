import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const createCLS = async (req: Request, res: Response) => {
  const { appointmentId, type, result, note } = req.body;
  try {
    const cls = await prisma.canLamSang.create({
      data: {
        appointmentId,
        type,
        result,
        note,
      },
    });
    res.status(201).json(cls);
  } catch (error) {
    console.error("Lỗi tạo CLS:", error);
    res.status(500).json({ message: "Lỗi tạo Cận Lâm Sàng" });
  }
};

export const getCLSByAppointment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  try {
    const data = await prisma.canLamSang.findMany({
      where: { appointmentId: Number(appointmentId) },
      orderBy: { date: "desc" },
    });
    res.json(data);
  } catch (error) {
    console.error("Lỗi lấy CLS:", error);
    res.status(500).json({ message: "Lỗi lấy kết quả CLS" });
  }
};
