import apiClient from './client';
import { HabitStats } from '../types';

export const statsApi = {
  async getStats(): Promise<HabitStats> {
    const res = await apiClient.get<any>('/stats');
    const raw = res.data;
    const stats: HabitStats = (raw && raw.data !== undefined) ? raw.data : raw;
    return stats;
  },
};

export default statsApi;
