import express from "express";
import {
  getPatientById,
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientMedicalRecords, // 👈 bạn đã có
} from "../controllers/patient.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// 🔧 Quan trọng: đặt route cụ thể hơn TRƯỚC
router.get("/:id/records", verifyToken, getPatientMedicalRecords);

// Các route còn lại
router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;
