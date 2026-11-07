import { User } from '../types';

export const mockUser: User = {
  _id: 'usr_an_123456',
  id: 'usr_an_123456',
  name: 'Nguyễn Minh An',
  fullName: 'Nguyễn Minh An',
  email: 'an@email.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  role: 'ROLE_USER',
  onboarding: {
    completed: true,
    goals: [
      'Dậy sớm mỗi ngày',
      'Đọc sách rèn luyện tư duy',
      'Uống đủ 2 lít nước',
      'Rèn luyện thể thao đều đặn',
    ],
    level: 'moderate',
    reminderSlots: ['07:00', '12:00', '17:00', '21:00'],
  },
  settings: {
    notificationsEnabled: true,
    theme: 'light',
    language: 'vi',
  },
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

// Tài khoản test chuẩn
export const TEST_CREDENTIALS = {
  email: 'an@email.com',
  password: '123456',
  token: 'mock-jwt-token-smart-habit-2026',
};
