import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';

type QueryParams = Record<string, unknown>;

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(endpoint: string, params?: QueryParams): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, { params });
    return (response.data.data || response.data) as T;
  }

  async post<T = unknown, B = unknown>(endpoint: string, data?: B): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data);
    return (response.data.data || response.data) as T;
  }

  async put<T = unknown, B = unknown>(endpoint: string, data?: B): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(endpoint, data);
    return (response.data.data || response.data) as T;
  }

  async patch<T = unknown, B = unknown>(endpoint: string, data?: B): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(endpoint, data);
    return (response.data.data || response.data) as T;
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint);
    return (response.data.data || response.data) as T;
  }

  async getPaginated<T = unknown>(
    endpoint: string,
    page = 1,
    pageSize = 10,
    filters?: QueryParams
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get<PaginatedResponse<T>>(endpoint, {
      params: {
        page,
        pageSize,
        ...filters,
      },
    });
    return response.data;
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getAuthHeader(): string | null {
    return localStorage.getItem('authToken');
  }

  setAuthHeader(token: string) {
    localStorage.setItem('authToken', token);
  }

  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

export default new ApiClient();