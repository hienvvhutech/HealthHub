//cspell:disable
import express, { Request, Response } from "express";
import {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getPatientsByDoctor,
  getAppointmentsByPatient,
  getAppointmentsForPatient,
  cancelAppointment,
  getAppointmentsForDoctor,
  getAppointmentById,
  deleteAppointment,
  hideAppointmentFromDoctor,
  getQueueStatus,
  getBookedTimes,
  checkInAppointment, 
} from "../controllers/appointment.controller";
import {
  verifyToken,
  verifyPatient,
  verifyDoctor,
} from "../middleware/verifyToken";

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
  return function (
    req: Request,
    res: Response,
    next: import("express").NextFunction
  ) {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// ✅ ROUTES
router.post("/", verifyToken, verifyPatient, (req: Request, res: Response) => {
  void createAppointment(req, res);
});

router.get("/", verifyToken, getAllAppointments);

router.put("/:id/status", verifyToken, verifyDoctor, updateAppointmentStatus);

// ✅ FIX ROUTE: Check-in endpoint (Dùng PUT cho /:id/check-in để khớp với frontend)
router.put("/:id/check-in", verifyToken, verifyPatient, (req: Request, res: Response) => {
    void checkInAppointment(req, res);
});

router.get(
  "/doctor/:id/patients",
  verifyToken,
  verifyDoctor,
  getPatientsByDoctor
);
router.get(
  "/patient/:id",
  verifyToken,
  verifyPatient,
  getAppointmentsByPatient
);
router.put("/:id/cancel", verifyToken, verifyPatient, cancelAppointment);

router.get(
  "/patient",
  verifyToken,
  verifyPatient,
  (req: Request, res: Response) => {
    getAppointmentsForPatient(req, res);
  }
);

router.get(
  "/doctor/me",
  verifyToken,
  verifyDoctor,
  (req: Request, res: Response) => {
    getAppointmentsForDoctor(req, res);
  }
);

router.get("/:id", verifyToken, (req: Request, res: Response) => {
  void getAppointmentById(req, res);
});

router.delete("/:id", verifyToken, (req: Request, res: Response) => {
  void deleteAppointment(req, res);
});

router.patch(
  "/:id/hide",
  verifyToken,
  verifyDoctor,
  (req: Request, res: Response) => {
    void hideAppointmentFromDoctor(req, res);
  }
);

router.get("/queue-status", getQueueStatus);

router.get(
  "/booked-times",
  verifyToken,
  verifyPatient,
  (req: Request, res: Response) => {
    void getBookedTimes(req, res);
  }
);

export default router;
