import apiClient from './client';
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
   * Đăng nhập tài khoản qua Backend Spring Boot
   */
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<any>('/auth/login', payload);
    const raw = response.data;
    const authData = (raw && raw.data !== undefined) ? raw.data : raw;
    const user: User = {
      _id: authData.user?.id || authData.user?._id || `usr_${Date.now()}`,
      id: authData.user?.id || authData.user?._id,
      name: authData.user?.fullName || authData.user?.name || 'Người dùng',
      fullName: authData.user?.fullName || authData.user?.name || 'Người dùng',
      email: authData.user?.email || payload.email,
      avatarUrl: authData.user?.avatar || authData.user?.avatarUrl,
      avatar: authData.user?.avatar || authData.user?.avatarUrl,
      role: authData.user?.role || 'ROLE_USER',
      onboarding: authData.user?.onboarding || {
        completed: true,
        goals: ['Rèn luyện sức khỏe', 'Đọc sách mỗi ngày'],
        level: 'moderate',
        reminderSlots: ['morning', 'evening'],
      },
      settings: authData.user?.settings || {
        notificationsEnabled: true,
        theme: 'light',
        language: 'vi',
      },
      createdAt: authData.user?.createdAt || new Date().toISOString(),
    };
    const result: AuthResponseData = {
      token: authData.token,
      user,
    };
    await storage.setItem('token', result.token);
    await storage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  /**
   * Đăng ký tài khoản mới qua Backend Spring Boot
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<any>('/auth/register', payload);
    const raw = response.data;
    const authData = (raw && raw.data !== undefined) ? raw.data : raw;
    const user: User = {
      _id: authData.user?.id || authData.user?._id || `usr_${Date.now()}`,
      id: authData.user?.id || authData.user?._id,
      name: authData.user?.fullName || authData.user?.name || payload.fullName,
      fullName: authData.user?.fullName || authData.user?.name || payload.fullName,
      email: authData.user?.email || payload.email,
      avatarUrl: authData.user?.avatar || authData.user?.avatarUrl,
      avatar: authData.user?.avatar || authData.user?.avatarUrl,
      role: authData.user?.role || 'ROLE_USER',
      onboarding: authData.user?.onboarding || {
        completed: true,
        goals: [],
        level: 'moderate',
        reminderSlots: ['morning', 'evening'],
      },
      settings: authData.user?.settings || {
        notificationsEnabled: true,
        theme: 'light',
        language: 'vi',
      },
      createdAt: authData.user?.createdAt || new Date().toISOString(),
    };
    const result: AuthResponseData = {
      token: authData.token,
      user,
    };
    await storage.setItem('token', result.token);
    await storage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  /**
   * Đăng xuất, xoá token khỏi thiết bị
   */
  async logout(): Promise<void> {
    await storage.removeItem('token');
    await storage.removeItem('user');
  },

  /**
   * Đổi mật khẩu tài khoản qua Backend Spring Boot
   */
  async changePassword(payload: { oldPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
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
