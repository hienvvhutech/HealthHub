import api from './api';
import { Doctor, Patient } from '../types';

class UserService {
  async getProfile(userId: number): Promise<Doctor | Patient> {
    return api.get(`/users/${userId}/profile`);
  }

  async updateProfile(userId: number, data: Partial<Doctor | Patient>): Promise<Doctor | Patient> {
    return api.put(`/users/${userId}/profile`, data);
  }

  async getDoctors(): Promise<Doctor[]> {
    return api.get<Doctor[]>('/doctors');
  }

  async getDoctorById(id: number): Promise<Doctor> {
    return api.get<Doctor>(`/doctors/${id}`);
  }

  async searchDoctors(specialty?: string, department?: string): Promise<Doctor[]> {
    return api.get<Doctor[]>('/doctors', {
      specialty,
      department,
    });
  }

  async getPatients(): Promise<Patient[]> {
    return api.get<Patient[]>('/patients');
  }

  async getPatientById(id: number): Promise<Patient> {
    return api.get<Patient>(`/patients/${id}`);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    return api.post(`/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
  }
}

export default new UserService();
