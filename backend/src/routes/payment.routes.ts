import express from "express";
import {
  getPaymentDetails,
  createPayment,
} from "../controllers/payment.controller";
import asyncHandler from "../middleware/asyncHandler";

const router = express.Router();

router.get("/:appointmentId", asyncHandler(getPaymentDetails));
router.post("/", asyncHandler(createPayment));

export default router;
