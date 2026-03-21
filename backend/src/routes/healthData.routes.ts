import { Router } from "express";
const router = Router();

import {
  addHealthData,
  getHealthData,
  deleteHealthData,
  uploadIoTData,
  getHealthDataByPatient,
  getHealthDataForDoctor,
} from "../controllers/healthData.controller";

import { verifyToken } from "../middleware/verifyToken";

// 🌐 API cơ bản (yêu cầu token)
router.post("/", verifyToken, addHealthData);
router.get("/", verifyToken, getHealthData);
router.delete("/:id", verifyToken, deleteHealthData);

// ⭐ API lấy dữ liệu theo bệnh nhân
router.get("/patient/:patientId", verifyToken, async (req, res, next) => {
  try {
    await getHealthDataByPatient(req, res);
  } catch (err) {
    next(err);
  }
});
router.get("/doctor/patient/:patientId", verifyToken, getHealthDataForDoctor);

// 📡 API IoT (không cần token vì thiết bị gửi)
router.post("/iot/upload", uploadIoTData);

export default router;
