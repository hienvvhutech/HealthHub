import { Router } from "express";
import { recommendController } from "../controllers/recommendation.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();
router.post("/", verifyToken, recommendController);

export default router;
