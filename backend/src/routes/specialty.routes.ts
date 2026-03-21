import express from "express";
import {
  getAllSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from "../controllers/specialty.controller";

const router = express.Router();

router.get("/", getAllSpecialties);
router.post("/", createSpecialty);
router.put("/:id", updateSpecialty);
router.delete("/:id", deleteSpecialty);

export default router;
