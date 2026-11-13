import apiClient from './client';
import { Achievement, UserAchievement } from '../types';

export const achievementApi = {
  async getAchievements(): Promise<Achievement[]> {
    const res = await apiClient.get<any>('/achievements');
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
  },

  async getUserAchievements(): Promise<UserAchievement[]> {
    const res = await apiClient.get<any>('/user-achievements');
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
  },
};

export default achievementApi;
