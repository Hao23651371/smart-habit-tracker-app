import { USE_MOCK } from '../config';
import apiClient from './client';
import { HabitStats } from '../types';
import { habitApi } from './habitApi';
import { logApi } from './logApi';
import { computeHabitStats } from '../utils/habitStats';

export const statsApi = {
  async getStats(): Promise<HabitStats> {
    if (USE_MOCK) {
      const [habits, logs] = await Promise.all([habitApi.getHabits(), logApi.getLogs()]);
      return computeHabitStats(habits, logs);
    }
    const res = await apiClient.get<HabitStats>('/stats');
    return res.data;
  },
};

export default statsApi;
