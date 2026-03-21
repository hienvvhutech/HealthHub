// User & Authentication Types
export interface User {
  id: number;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'doctor' | 'patient';
}

// Doctor Types
export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  department?: string;
  phone?: string;
  experience?: number;
  languages?: string;
  bio?: string;
  specialtyId?: number;
  dob?: string;
  hospital?: string;
}

// Patient Types
export interface Patient {
  id: number;
  code?: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
}

// Specialty Types
export interface Specialty {
  id: number;
  name: string;
  description?: string;
}

// Appointment Types
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  doctorName?: string;
  patientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Health Data Types
export interface HealthData {
  id: number;
  userId: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bloodSugar?: number;
  oxygenLevel?: number;
  recordedAt: string;
  notes?: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  description: string;
  diagnosis?: string;
  treatment?: string;
  recordDate: string;
  documents?: string[];
}

// Prescription Types
export interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  medicineId: number;
  medicineName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  prescribedDate: string;
}

// Medicine Types
export interface Medicine {
  id: number;
  name: string;
  dosage?: string;
  manufacturer?: string;
  price?: number;
  description?: string;
}

// Chat Types
export interface ChatMessage {
  id: number;
  senderId: number;
  recipientId: number;
  sessionId?: number;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

export interface ChatSession {
  id: number;
  doctorId?: number;
  patientId?: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

// Feedback Types
export interface Feedback {
  id: number;
  doctorId: number;
  patientId: number;
  rating: number;
  comment?: string;
  createdAt?: string;
}

// Payment Types
export interface Payment {
  id: number;
  appointmentId?: number;
  patientId: number;
  amount: number;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt?: string;
}

// Recommendation Types
export interface Recommendation {
  id: number;
  patientId: number;
  type: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
