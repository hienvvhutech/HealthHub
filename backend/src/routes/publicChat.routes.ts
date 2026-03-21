import { Router, Request, Response, NextFunction } from "express";
import {
  sendPublicMessage,
  getPublicChatHistory,
  sendAdminReply,
  getChatSessions,
} from "../controllers/publicChat.controller";

const router = Router();

// Wrapper để xử lý async/await và type mismatch
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res)).catch(next);
};

router.post("/send", asyncHandler(sendPublicMessage));
router.get("/history/:chatId", asyncHandler(getPublicChatHistory));
router.post("/admin-send", asyncHandler(sendAdminReply));
router.get("/sessions", asyncHandler(getChatSessions));

export default router;
