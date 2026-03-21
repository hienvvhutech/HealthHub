import { Request, Response } from "express";
import { callAIModel } from "../services/ai.service";

export const aiChatController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const message = req.body.message;

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Vui lòng nhập nội dung tin nhắn.",
      });
      return;
    }

    const aiResponse = await callAIModel({
      messages: [{ role: "user", content: message }],
      context: {}, // Chat chung → không cần context
    });

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server khi gọi AI",
    });
  }
};
