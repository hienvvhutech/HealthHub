import { Router } from "express";
import { aiChatController } from "../controllers/ai.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.post("/chat", verifyToken, aiChatController);
export default router;
