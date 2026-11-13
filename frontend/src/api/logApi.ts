import apiClient from './client';
import { HabitLog } from '../types';
import { formatDate } from '../utils/date';

export const logApi = {
  async getLogs(): Promise<HabitLog[]> {
    const res = await apiClient.get<any>('/habit-logs');
    const raw = res.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
    return list.map((l: any) => ({
      ...l,
      _id: l._id || l.id,
      id: l.id || l._id,
    }));
  },

  async toggleHabitCheck(habitId: string, date: string = formatDate()): Promise<{ status: 'done' | 'undone'; log?: HabitLog }> {
    const res = await apiClient.post<any>('/habit-logs/toggle', { habitId, date });
    const raw = res.data;
    const data = (raw && raw.data !== undefined) ? raw.data : raw;
    if (data?.log) {
      data.log = {
        ...data.log,
        _id: data.log._id || data.log.id,
        id: data.log.id || data.log._id,
      };
    }
    return data;
  },
};

export default logApi;
