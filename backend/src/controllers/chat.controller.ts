import { Request, Response } from "express";
import prisma from "../../prisma/client";

// Mở rộng Request để có thuộc tính user
declare module 'express' {
  interface Request {
    user?: { id: number; email: string; role: string; patientId?: number; doctorId?: number };
  }
}

// 🔄 API lấy danh sách chat session
export const getChatSessions = async (req: Request, res: Response) => {
  const { userId, role } = req.query;

  try {
    if (role === "doctor") {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: parseInt(userId as string) },
      });

      if (!doctor) {
        return res.json([]);
      }

      const sessions = await prisma.chatSession.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: true,
          messages: {
            orderBy: { sentAt: "asc" },
          },
        },
      });

      return res.json(sessions);
    }

    // ✅ Nếu là patient
    const patient = await prisma.patient.findUnique({
      where: { userId: parseInt(userId as string) },
    });

    if (!patient) {
      return res.json([]);
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          include: {
            specialty: true,
          },
        },
        messages: {
          orderBy: { sentAt: "asc" },
        },
      },
    });

    return res.json(sessions);
  } catch (error) {
    console.error("❌ getChatSessions:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách chat session" });
  }
};

// 🔄 API lấy chi tiết chat session theo ID
export const getChatSessionById = async (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.sessionId);

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, email: true } }, // Get doctor's User ID
            specialty: true
          }
        },
        patient: {
          include: {
            user: { select: { id: true, email: true } } // Get patient's User ID
          }
        }
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("❌ getChatSessionById:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chat session" });
  }
};


// Tạo hoặc lấy session giữa doctor và patient
export const createOrGetChatSession = async (req: Request, res: Response) => {
  const { doctorId } = req.body; // Chỉ nhận doctorId từ body
  const userId = req.user?.id; // Lấy userId từ token đã giải mã

  console.log("🔍 [createOrGetChatSession] Nhận yêu cầu tạo/lấy session chat:", { doctorId, userIdFromToken: userId });

  if (!userId) {
    console.error("❌ [createOrGetChatSession] User ID không có trong token.");
    return res.status(401).json({ message: "Không tìm thấy thông tin người dùng từ token" });
  }

  try {
    // Tìm patientId thực tế dựa trên userId từ token
    const patient = await prisma.patient.findUnique({
      where: { userId: userId }
    });

    if (!patient) {
        console.error("❌ [createOrGetChatSession] Không tìm thấy Patient cho User ID:", userId);
        return res.status(404).json({ message: "Patient not found for this user ID" });
    }

    const realPatientId = patient.id;
    console.log("✅ [createOrGetChatSession] Tìm thấy Patient ID thực tế:", realPatientId);

    let session = await prisma.chatSession.findFirst({
      where: { doctorId: parseInt(doctorId), patientId: realPatientId },
    });
    console.log("🔍 [createOrGetChatSession] Kết quả tìm session cũ:", session);

    if (!session) {
      console.log("✨ [createOrGetChatSession] Tạo session mới...");
      session = await prisma.chatSession.create({
        data: { doctorId: parseInt(doctorId), patientId: realPatientId },
      });
      console.log("✅ [createOrGetChatSession] Đã tạo session mới:", session);
    }

    res.json(session);
  } catch (error) {
    console.error("❌ [createOrGetChatSession] Lỗi khi tạo hoặc lấy chat session:", error);
    res.status(500).json({ message: "Lỗi khi tạo hoặc lấy chat session" });
  }
};

// Lấy tin nhắn của 1 session
export const getMessages = async (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.sessionId);

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { sentAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    console.error("❌ getMessages:", error);
    res.status(500).json({ message: "Lỗi khi lấy tin nhắn" });
  }
};

// Gửi tin nhắn mới
export const sendMessage = async (req: Request, res: Response) => {
  const { content, chatSessionId, senderId, receiverId } = req.body;

  try {
    const message = await prisma.chatMessage.create({
      data: { content, chatSessionId, senderId, receiverId },
    });

    req.app
      .get("io")
      .to(`session-${chatSessionId}`)
      .emit("newMessage", message);

    res.json(message);
  } catch (error) {
    console.error("❌ sendMessage:", error);
    res.status(500).json({ message: "Lỗi khi gửi tin nhắn" });
  }
};
