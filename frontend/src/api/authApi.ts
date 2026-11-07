import { USE_MOCK } from '../config';
import apiClient from './client';
import { mockUser, TEST_CREDENTIALS } from '../mock/users';
import { User } from '../types';
import { storage } from '../utils/storage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export const authApi = {
  /**
   * Đăng nhập tài khoản
   */
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    if (USE_MOCK) {
      // Giả lập độ trễ mạng thực tế
      await new Promise((resolve) => setTimeout(resolve, 600));

      const trimmedEmail = payload.email.trim().toLowerCase();
      if (
        trimmedEmail === TEST_CREDENTIALS.email.toLowerCase() &&
        payload.password === TEST_CREDENTIALS.password
      ) {
        const result: AuthResponseData = {
          token: TEST_CREDENTIALS.token,
          user: mockUser,
        };
        await storage.setItem('token', result.token);
        await storage.setItem('user', JSON.stringify(result.user));
        return result;
      }

      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Khi kết nối Backend Spring Boot thật
    const response = await apiClient.post<AuthResponseData>('/auth/login', payload);
    const data = response.data;
    await storage.setItem('token', data.token);
    await storage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  /**
   * Đăng ký tài khoản mới
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newUser: User = {
        ...mockUser,
        _id: `usr_${Date.now()}`,
        id: `usr_${Date.now()}`,
        name: payload.fullName,
        fullName: payload.fullName,
        email: payload.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      };

      const result: AuthResponseData = {
        token: `mock-jwt-${Date.now()}`,
        user: newUser,
      };

      await storage.setItem('token', result.token);
      await storage.setItem('user', JSON.stringify(result.user));
      return result;
    }

    const response = await apiClient.post<AuthResponseData>('/auth/register', payload);
    const data = response.data;
    await storage.setItem('token', data.token);
    await storage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  /**
   * Đăng xuất, xoá token khỏi thiết bị
   */
  async logout(): Promise<void> {
    await storage.removeItem('token');
    await storage.removeItem('user');
  },

  /**
   * Lấy thông tin user đã lưu trong storage
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default authApi;
