// src/services/axiosInstance.ts
import axios from "axios";
import { getApiUrl } from "./apiConfig";

const instance = axios.create({
  baseURL: getApiUrl(),
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
