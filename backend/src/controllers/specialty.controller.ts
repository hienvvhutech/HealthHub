import { Request, Response } from "express";
import prisma from "../../prisma/client";

// GET all specialties
export const getAllSpecialties = async (req: Request, res: Response) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
    });
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách chuyên khoa" });
  }
};

// POST new specialty
export const createSpecialty = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const created = await prisma.specialty.create({ data: { name } });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo chuyên khoa" });
  }
};

// PUT update specialty
export const updateSpecialty = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  try {
    const updated = await prisma.specialty.update({
      where: { id },
      data: { name },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật chuyên khoa" });
  }
};

// DELETE specialty
export const deleteSpecialty = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.specialty.delete({ where: { id } });
    res.json({ message: "Đã xoá chuyên khoa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xoá chuyên khoa" });
  }
};
