import express from "express";
import {
  createPrescription,
  getPrescriptionsByPatient,
} from "../controllers/prescription.controller";

const router = express.Router();

router.post("/", createPrescription); // tạo đơn thuốc
router.get("/patient/:id", getPrescriptionsByPatient); // lấy đơn thuốc theo bệnh nhân

export default router;
