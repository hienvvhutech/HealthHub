import axios from "axios";
import { getApiUrl } from "../services/apiConfig";

// ✅ Sử dụng helper để tự động nhận diện Web/Android
const BASE_URL = getApiUrl();
const API_URL = `${BASE_URL}/auth`;

export const login = (email: string, password: string) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

export const register = (email: string, password: string, role: string) => {
  return axios.post(`${API_URL}/register`, { email, password, role });
};

export const forgotPassword = (email: string) => {
  return axios.post(`${API_URL}/forgot-password`, { email });
};

export const resetPassword = (token: string, password: string) => {
  return axios.post(`${API_URL}/reset-password`, { token, password });
};
