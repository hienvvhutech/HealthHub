import api from './api';
import { Appointment, AppointmentStatus } from '../types';

class AppointmentService {
  async getAppointments(patientId?: number): Promise<Appointment[]> {
    if (patientId) {
      return api.get<Appointment[]>(`/appointments?patientId=${patientId}`);
    }
    return api.get<Appointment[]>('/appointments');
  }

  async getAppointmentById(id: number): Promise<Appointment> {
    return api.get<Appointment>(`/appointments/${id}`);
  }

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    return api.post<Appointment>('/appointments', data);
  }

  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
    return api.put<Appointment>(`/appointments/${id}`, data);
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    return api.put<Appointment>(`/appointments/${id}`, {
      status: AppointmentStatus.CANCELLED,
    });
  }

  async getQueueStatus(): Promise<any> {
    return api.get('/appointments/queue-status');
  }

  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    return api.get<Appointment[]>(`/appointments?doctorId=${doctorId}`);
  }

  async rescheduleAppointment(id: number, newDate: string, newTime: string): Promise<Appointment> {
    return api.put<Appointment>(`/appointments/${id}`, {
      appointmentDate: newDate,
      appointmentTime: newTime,
    });
  }
}

export default new AppointmentService();
