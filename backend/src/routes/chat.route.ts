import express from "express";
import {
  getChatSessions,
  createOrGetChatSession,
  getMessages,
  sendMessage,
  getChatSessionById,
} from "../controllers/chat.controller";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/session/:sessionId", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getChatSessionById(req, res)).catch(next);
});

router.get("/session", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getChatSessions(req, res)).catch(next);
});
router.post("/session", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(createOrGetChatSession(req, res)).catch(next);
});
router.get(
  "/messages/:sessionId",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(getMessages(req, res)).catch(next);
  }
);
router.post("/messages", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(sendMessage(req, res)).catch(next);
});

export default router;
