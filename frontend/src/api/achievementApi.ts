import { USE_MOCK } from '../config';
import apiClient from './client';
import { mockAchievements } from '../mock/achievements';
import { mockUserAchievements } from '../mock/userAchievements';
import { Achievement, UserAchievement } from '../types';

export const achievementApi = {
  async getAchievements(): Promise<Achievement[]> {
    if (USE_MOCK) {
      return [...mockAchievements];
    }
    const res = await apiClient.get<Achievement[]>('/achievements');
    return res.data;
  },

  async getUserAchievements(): Promise<UserAchievement[]> {
    if (USE_MOCK) {
      return [...mockUserAchievements];
    }
    const res = await apiClient.get<UserAchievement[]>('/user-achievements');
    return res.data;
  },
};

export default achievementApi;
