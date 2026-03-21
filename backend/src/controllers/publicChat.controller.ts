import { Request, Response } from "express";
import prisma from "../../prisma/client";
import jwt from "jsonwebtoken";

// Hàm xác định ID người chat (để gom nhóm tin nhắn)
const resolveChatId = (req: Request, chatIdFromBody?: string): string => {
  const token = req.headers.authorization?.split(" ")[1];
  
  // 1. Ưu tiên lấy từ Token (nếu đã đăng nhập)
  if (token) {
    try {
      const decoded: any = jwt.verify(token, "SECRET_KEY");
      if (decoded?.patientId) {
        return `patient-${decoded.patientId}`;
      }
    } catch {}
  }
  
  // 2. Nếu chưa login, dùng ID từ localStorage gửi lên (guest-...)
  return chatIdFromBody || `guest-${Date.now()}`;
};

export const sendPublicMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, message } = req.body;

    if (!message) {
      res.status(400).json({ message: "Thiếu nội dung tin nhắn!" });
      return;
    }

    const realChatId = resolveChatId(req, chatId);

    // 1. Lưu tin nhắn User vào DB
    const userMsg = await prisma.publicChatMessage.create({
      data: {
        guestId: realChatId,
        sender: "user",
        message,
      },
    });

    // 2. Gửi Socket cho Admin & Client (Real-time)
    const io = req.app.get("io");
    // Emit vào room chung hoặc room riêng của guestId
    // Ở đây emit thẳng vào room public-chat-{guestId} để client nghe
    io.emit("newPublicMessage", userMsg); 

    // 3. (Optional) Auto-reply từ hệ thống
    /*
    const sysMsg = await prisma.publicChatMessage.create({
      data: {
        guestId: realChatId,
        sender: "system",
        message: "Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm.",
      },
    });
    io.emit("newPublicMessage", sysMsg);
    */

    res.json(userMsg);
  } catch (err) {
    console.error("Lỗi gửi tin:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const sendAdminReply = async (req: Request, res: Response) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      res.status(400).json({ message: "Thiếu thông tin!" });
      return;
    }

    // 1. Lưu tin nhắn Admin vào DB
    const saved = await prisma.publicChatMessage.create({
      data: {
        guestId: chatId,
        sender: "admin",
        message,
      },
    });

    // 2. Gửi Socket cho Bệnh nhân (Real-time)
    const io = req.app.get("io");
    io.emit("newPublicMessage", saved);

    res.json(saved);
  } catch (err) {
    console.error("Lỗi admin gửi tin:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getPublicChatHistory = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const messages = await prisma.publicChatMessage.findMany({
      where: { guestId: chatId },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getChatSessions = async (req: Request, res: Response) => {
  try {
    // Lấy danh sách các guestId đã từng chat, sắp xếp theo tin nhắn mới nhất
    const groups = await prisma.publicChatMessage.groupBy({
      by: ['guestId'],
      _max: {
        createdAt: true
      },
      orderBy: {
        _max: {
          createdAt: 'desc'
        }
      }
    });
    
    // Format lại dữ liệu trả về
    const sessions = groups.map(g => ({
      guestId: g.guestId,
      lastActive: g._max.createdAt
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Lỗi lấy danh sách session:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
