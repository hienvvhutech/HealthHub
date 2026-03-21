import express from "express";
import {
  getReExamAppointments,
  confirmReExam,
  cancelReExam,
} from "../controllers/reexam.controller";
import { verifyToken, verifyPatient } from "../middleware/verifyToken";
import { asyncHandler } from "../utils/asyncHandler";
const router = express.Router();

router.get(
  "/",
  verifyToken,
  verifyPatient,
  asyncHandler(getReExamAppointments)
);
router.patch(
  "/:id/confirm",
  verifyToken,
  verifyPatient,
  asyncHandler(confirmReExam)
);
router.delete("/:id", verifyToken, verifyPatient, asyncHandler(cancelReExam));

export default router;
