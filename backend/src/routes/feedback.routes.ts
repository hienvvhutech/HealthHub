import express, { RequestHandler } from "express";
import {
  createFeedback,
  getAllFeedbacks,
} from "../controllers/feedback.controller";

const router = express.Router();

// Gửi phản hồi mới
router.post("/feedbacks", createFeedback as RequestHandler);

// Lấy danh sách phản hồi
router.get("/feedbacks", getAllFeedbacks as RequestHandler);

export default router;
