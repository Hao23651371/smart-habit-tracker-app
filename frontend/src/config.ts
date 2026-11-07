/**
 * Cấu hình toàn bộ ứng dụng Smart Habit Tracker
 */

// Cờ sử dụng Mock Data (true: dùng mock, false: gọi API Backend Spring Boot)
export const USE_MOCK = true;

// URL cơ sở cho Backend Spring Boot
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

// Thời gian chờ API (ms)
export const API_TIMEOUT = 10000;
