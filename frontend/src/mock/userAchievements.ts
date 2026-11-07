import { UserAchievement } from '../types';
import { mockAchievements } from './achievements';

export const mockUserAchievements: UserAchievement[] = [
  {
    _id: 'ua_1',
    id: 'ua_1',
    userId: 'usr_an_123456',
    achievementId: 'ach_FIRST_HABIT',
    unlockedAt: '2026-10-01T08:00:00Z',
    achievement: mockAchievements.find((a) => a.code === 'FIRST_HABIT'),
  },
  {
    _id: 'ua_2',
    id: 'ua_2',
    userId: 'usr_an_123456',
    achievementId: 'ach_FIRST_CHECKIN',
    unlockedAt: '2026-10-01T09:00:00Z',
    achievement: mockAchievements.find((a) => a.code === 'FIRST_CHECKIN'),
  },
  {
    _id: 'ua_3',
    id: 'ua_3',
    userId: 'usr_an_123456',
    achievementId: 'ach_STREAK_3',
    unlockedAt: '2026-10-04T10:00:00Z',
    achievement: mockAchievements.find((a) => a.code === 'STREAK_3'),
  },
  {
    _id: 'ua_4',
    id: 'ua_4',
    userId: 'usr_an_123456',
    achievementId: 'ach_STREAK_7',
    unlockedAt: '2026-10-08T10:00:00Z',
    achievement: mockAchievements.find((a) => a.code === 'STREAK_7'),
  },
];
