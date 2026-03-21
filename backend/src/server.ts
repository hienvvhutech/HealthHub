import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import os from "os";
import { Server } from "socket.io"; 
import { getQueueStatus } from "./controllers/appointment.controller";
import { startScheduler, initSchedulerSocket } from "./utils/scheduler"; // ✅ Import initSchedulerSocket

import appointmentRoutes from "./routes/appointment.routes";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctor.routes";
import patientRoutes from "./routes/patient.routes";
import userRoutes from "./routes/user.routes";
import feedbackRoutes from "./routes/feedback.routes";
import medicalRecordRoutes from "./routes/medicalRecord.routes";
import clsRoutes from "./routes/cls.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import paymentRoutes from "./routes/payment.routes";
import specialtyRoutes from "./routes/specialty.routes";
import reExamRoutes from "./routes/reexam.routes";
import chatRoutes from "./routes/chat.route";
import healthDataRoutes from "./routes/healthData.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import revenueRoutes from "./routes/revenue.routes";
import medicineRoutes from "./routes/medicine.routes";
import aiRoutes from "./routes/ai.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import publicChatRoutes from "./routes/publicChat.routes";
import screeningRoutes from "./routes/screening.routes";
import reminderRoutes from "./routes/reminder.routes";
import notificationRoutes from "./routes/notification.routes"; 
import { verifyToken } from "./middleware/verifyToken";

const app = express();
const PORT = 5000;

app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// ✅ Public routes
app.use("/api/auth", authRoutes);
app.get("/api/appointments/queue-status", getQueueStatus);
app.use("/api/screening/seed", screeningRoutes);

// ✅ Protected routes
app.use("/api/appointments", verifyToken, appointmentRoutes);
app.use("/api/doctors", verifyToken, doctorRoutes);
app.use("/api/patients", verifyToken, patientRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/feedbacks", verifyToken, feedbackRoutes);
app.use("/api/revenue", verifyToken, revenueRoutes);
app.use("/api/cls", verifyToken, clsRoutes);
app.use("/api/medical-records", verifyToken, medicalRecordRoutes);
app.use("/api/prescriptions", verifyToken, prescriptionRoutes);
app.use("/api/payments", verifyToken, paymentRoutes);
app.use("/api/specialties", verifyToken, specialtyRoutes);
app.use("/api/reexam", verifyToken, reExamRoutes);
app.use("/api/chat", verifyToken, chatRoutes);
app.use("/api/healthdata", healthDataRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/public-chat", publicChatRoutes);
app.use("/api/screening", screeningRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/notifications", notificationRoutes); 

app.get("/", (req, res) => {
  res.send("HealthHub backend is running...");
});

// ✅ Khởi tạo server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  
  // Khởi động scheduler dọn dẹp lịch cũ
  startScheduler();

  const interfaces = os.networkInterfaces();
  let ipAddress = "localhost";
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
  }
  
  console.log(`📱 Mobile/Emulator access: http://${ipAddress}:${PORT}`);
});

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
});
app.set("io", io);

// ✅ Inject Socket IO vào Scheduler
initSchedulerSocket(io);

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("joinSession", (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`💬 Socket joined session-${sessionId}`);
  });

  socket.on("joinUserRoom", (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`👤 User joined room: user-${userId}`);
    }
  });

  socket.on("joinPublicChat", (chatId) => {
    if(chatId) {
      socket.join(chatId);
      console.log(`🌍 Guest joined public chat: ${chatId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});
