import api from './api';
import { MedicalRecord, Prescription, Feedback } from '../types';

class PatientService {
  // Medical Records
  async getMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
    return api.get<MedicalRecord[]>(`/medical-records?patientId=${patientId}`);
  }

  async getMedicalRecordById(id: number): Promise<MedicalRecord> {
    return api.get<MedicalRecord>(`/medical-records/${id}`);
  }

  async createMedicalRecord(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    return api.post<MedicalRecord>('/medical-records', data);
  }

  async updateMedicalRecord(id: number, data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    return api.put<MedicalRecord>(`/medical-records/${id}`, data);
  }

  // Prescriptions
  async getPrescriptions(patientId: number): Promise<Prescription[]> {
    return api.get<Prescription[]>(`/prescriptions?patientId=${patientId}`);
  }

  async getPrescriptionById(id: number): Promise<Prescription> {
    return api.get<Prescription>(`/prescriptions/${id}`);
  }

  async createPrescription(data: Partial<Prescription>): Promise<Prescription> {
    return api.post<Prescription>('/prescriptions', data);
  }

  async updatePrescription(id: number, data: Partial<Prescription>): Promise<Prescription> {
    return api.put<Prescription>(`/prescriptions/${id}`, data);
  }

  // Feedback
  async getFeedback(patientId: number): Promise<Feedback[]> {
    return api.get<Feedback[]>(`/feedbacks?patientId=${patientId}`);
  }

  async createFeedback(data: Partial<Feedback>): Promise<Feedback> {
    return api.post<Feedback>('/feedbacks', data);
  }

  async updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback> {
    return api.put<Feedback>(`/feedbacks/${id}`, data);
  }
}

export default new PatientService();
