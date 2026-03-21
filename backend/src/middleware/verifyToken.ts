import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "mysecret";

// Middleware xác thực token
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Không có token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded.id || !decoded.email || !decoded.role) {
      res.status(403).json({ error: "Token không chứa đủ thông tin." });
      return;
    }

    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      patientId: decoded.patientId,
      doctorId: decoded.doctorId,
    };

    console.log("✅ TOKEN GIẢI MÃ:", (req as any).user);
    next();
  } catch (error) {
    res.status(403).json({ error: "Token không hợp lệ." });
  }
};

// Middleware kiểm tra vai trò bệnh nhân
export const verifyPatient = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as any).user;
  if (user.role !== "patient") {
    res.status(403).json({ error: "Chỉ bệnh nhân mới có quyền truy cập." });
    return;
  }
  next();
};

// Middleware kiểm tra vai trò bác sĩ
export const verifyDoctor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as any).user;
  if (user.role !== "doctor") {
    res.status(403).json({ error: "Chỉ bác sĩ mới có quyền truy cập." });
    return;
  }
  next();
};
