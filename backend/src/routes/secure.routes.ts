import express from "express";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// Route thử nghiệm xác thực JWT
router.get("/secure", verifyToken, (req, res) => {
  const user = (req as any).user; // lấy từ middleware verifyToken
  res.json({
    message: "Bạn đã truy cập API bảo mật!",
    user,
  });
});

export default router;
