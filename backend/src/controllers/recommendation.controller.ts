import { Request, Response } from "express";
import { getRecommendation } from "../services/recommendation.service";

export const recommendController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = Number(req.user?.patientId || req.body.patientId);
    const message = req.body.message;

    if (!patientId) {
      res.status(400).json({ error: "Không tìm thấy patientId." });
      return;
    }

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "Vui lòng nhập mô tả triệu chứng." });
      return;
    }

    const result = await getRecommendation(patientId, message);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in recommendController:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server khi xử lý AI Recommendation",
    });
  }
};
