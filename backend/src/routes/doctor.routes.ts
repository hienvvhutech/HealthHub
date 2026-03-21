import express from "express";
import {
  getAllDoctors,
  getDoctorByMe, // ✅ Đảm bảo đã import
  updateDoctor,
  createDoctor,
  getAppointmentsByDoctorLogin,
  updateDoctorByMe,
  deleteAppointmentByDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller";
import { createPrescription } from "../controllers/prescription.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

router.get("/me", verifyToken, async (req, res, next) => {
  try {
    await getDoctorByMe(req, res); // ✅ fix lỗi 404
  } catch (err) {
    next(err);
  }
});

router.get("/", getAllDoctors);
router.post("/", async (req, res, next) => {
  try {
    await createDoctor(req, res);
  } catch (err) {
    next(err);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    await updateDoctor(req, res);
  } catch (err) {
    next(err);
  }
});
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    await deleteDoctor(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete("/appointments/:id", verifyToken, async (req, res, next) => {
  try {
    await deleteAppointmentByDoctor(req, res);
  } catch (err) {
    next(err);
  }
});
router.post("/prescriptions", verifyToken, createPrescription);
router.get("/appointments/me", verifyToken, async (req, res, next) => {
  try {
    await getAppointmentsByDoctorLogin(req, res);
  } catch (err) {
    next(err);
  }
});
router.put("/me", verifyToken, async (req, res, next) => {
  try {
    await updateDoctorByMe(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
