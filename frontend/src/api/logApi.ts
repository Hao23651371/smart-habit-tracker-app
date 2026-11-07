import { USE_MOCK } from '../config';
import apiClient from './client';
import { mockHabitLogs } from '../mock/logs';
import { HabitLog } from '../types';
import { formatDate } from '../utils/date';

let localLogs = [...mockHabitLogs];

export const logApi = {
  async getLogs(): Promise<HabitLog[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return [...localLogs];
    }
    const res = await apiClient.get<HabitLog[]>('/habit-logs');
    return res.data;
  },

  async toggleHabitCheck(habitId: string, date: string = formatDate()): Promise<{ status: 'done' | 'undone'; log?: HabitLog }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const existingIndex = localLogs.findIndex(
        (l) => l.habitId === habitId && l.date === date
      );

      if (existingIndex !== -1) {
        const existing = localLogs[existingIndex];
        if (existing.status === 'done') {
          // Bỏ check
          localLogs.splice(existingIndex, 1);
          return { status: 'undone' };
        } else {
          // Đổi sang done
          existing.status = 'done';
          existing.completedAt = new Date().toISOString();
          return { status: 'done', log: existing };
        }
      } else {
        // Tạo log done mới
        const newLog: HabitLog = {
          _id: `log_${date}_${habitId}`,
          id: `log_${date}_${habitId}`,
          userId: 'usr_an_123456',
          habitId,
          date,
          status: 'done',
          value: 1,
          currentValue: 1,
          completedAt: new Date().toISOString(),
          loggedAt: new Date().toISOString(),
        };
        localLogs.push(newLog);
        return { status: 'done', log: newLog };
      }
    }

    const res = await apiClient.post(`/habit-logs/toggle`, { habitId, date });
    return res.data;
  },
};

export default logApi;
