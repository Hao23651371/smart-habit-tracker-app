import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Cấu hình toàn bộ ứng dụng Smart Habit Tracker
 */

// Cờ sử dụng Mock Data (luôn false vì dùng CSDL MongoDB thật)
export const USE_MOCK = false;

/**
 * Tự động xác định URL Backend:
 * - Trên Web: kết nối qua http://localhost:8080/api
 * - Trên Mobile (Expo Go / Android / iOS): Tự động lấy IP máy tính từ hostUri của Metro (ví dụ: 192.168.1.91:8080/api)
 */
function resolveApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
  }

  // Trên thiết bị thật / máy ảo qua Expo Go
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8080/api`;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.91:8080/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

// Thời gian chờ API (ms)
export const API_TIMEOUT = 10000;
