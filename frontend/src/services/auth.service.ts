import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.token) {
      api.setAuthHeader(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.token) {
      api.setAuthHeader(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  async logout(): Promise<void> {
    api.clearAuth();
  }

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh');
    if (response.token) {
      api.setAuthHeader(response.token);
    }
    return response;
  }
}

export default new AuthService();
