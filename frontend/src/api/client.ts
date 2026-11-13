import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config';
import { storage } from '../utils/storage';

/**
 * Axios instance chuẩn cho toàn bộ ứng dụng
 * Tự động gắn Bearer Token qua Request Interceptor
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor gắn Bearer Token từ storage vào mỗi request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[apiClient] Error attaching token to request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý lỗi tập trung (ví dụ 401/403 Unauthorized/Forbidden)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Khi token hết hạn hoặc không hợp lệ, xoá token khỏi storage
      await storage.removeItem('token');
      await storage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
