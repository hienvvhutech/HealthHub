import { Router, Request, Response, NextFunction } from "express";
import { getMedicines } from "../controllers/medicine.controller";

const router = Router();

// GET /api/medicines
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getMedicines(req, res).catch(next);
});

export default router;
