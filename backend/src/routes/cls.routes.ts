import express from "express";
import { createCLS, getCLSByAppointment } from "../controllers/cls.controller";
import prisma from "../../prisma/client";

const router = express.Router();

router.post("/", createCLS);
router.get("/appointment/:appointmentId", getCLSByAppointment);

// GET /api/cls/types
router.get("/types", async (req, res) => {
  try {
    const types = await prisma.cLSType.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });

    res.json(types); // [{ id, name }, ...]
  } catch (error) {
    console.error("Lỗi khi lấy loại CLS:", error);
    res.status(500).json({ message: "Lỗi khi lấy loại CLS" });
  }
});

export default router;
