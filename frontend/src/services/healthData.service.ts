import api from './api';
import { HealthData, PaginatedResponse } from '../types';

class HealthDataService {
  async getHealthData(userId: number): Promise<HealthData[]> {
    return api.get<HealthData[]>(`/health-data?userId=${userId}`);
  }

  async getHealthDataById(id: number): Promise<HealthData> {
    return api.get<HealthData>(`/health-data/${id}`);
  }

  async createHealthData(data: Partial<HealthData>): Promise<HealthData> {
    return api.post<HealthData>('/health-data', data);
  }

  async updateHealthData(id: number, data: Partial<HealthData>): Promise<HealthData> {
    return api.put<HealthData>(`/health-data/${id}`, data);
  }

  async deleteHealthData(id: number): Promise<void> {
    return api.delete(`/health-data/${id}`);
  }

  async getHealthDataPaginated(
    userId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<HealthData>> {
    return api.getPaginated<HealthData>('/health-data', page, pageSize, { userId });
  }

  async getLatestHealthData(userId: number): Promise<HealthData> {
    return api.get<HealthData>(`/health-data/latest?userId=${userId}`);
  }
}

export default new HealthDataService();
