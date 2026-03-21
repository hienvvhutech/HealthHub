import express from "express";
import {
  getMedicalRecordsByPatient,
  downloadPrescriptionPdf,
  createMedicalRecordWithReExam,
  getMedicalRecordsByPatientId,
  getMedicalRecordsByDoctor,
  updateMedicalRecord,
} from "../controllers/medicalRecord.controller";
import { verifyDoctor, verifyToken } from "../middleware/verifyToken";

const router = express.Router();

function asyncHandler(
  fn: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<any>
) {
  return function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Bệnh nhân: lấy hồ sơ của mình
router.get("/me", verifyToken, asyncHandler(getMedicalRecordsByPatient));

// Bác sĩ: Lấy lịch sử khám của một bệnh nhân cụ thể (theo ID bệnh nhân)
router.get(
  "/patient/:id",
  verifyToken,
  verifyDoctor,
  asyncHandler(getMedicalRecordsByPatientId)
);

router.get("/prescription/:id/pdf", asyncHandler(downloadPrescriptionPdf));

router.post(
  "/create",
  verifyToken,
  asyncHandler(createMedicalRecordWithReExam)
);

// Bác sĩ: lấy danh sách hồ sơ do mình khám
router.get(
  "/me-doctor",
  verifyToken,
  verifyDoctor,
  asyncHandler(getMedicalRecordsByDoctor)
);

router.put(
  "/:id",
  verifyToken,
  verifyDoctor,
  asyncHandler(updateMedicalRecord)
);

export default router;
