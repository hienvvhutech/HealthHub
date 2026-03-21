import { Capacitor } from "@capacitor/core";

export const getApiUrl = () => {
  const url = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  
  if (Capacitor.isNativePlatform()) {
    return url.replace("localhost", "10.0.2.2");
  }
  
  return url;
};

// Helper cho Socket.IO (bỏ /api)
export const getSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace("/api", "");
};
