import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const meds = await prisma.medication.findMany({
      select: {
        id: true,
        name: true,
        dosage: true,
        frequency: true,
        duration: true,
        note: true,
      },
    });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách thuốc." });
  }
});

export default router;
