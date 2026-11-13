import apiClient from './client';
import { Habit } from '../types';

export const habitApi = {
  async getHabits(): Promise<Habit[]> {
    const res = await apiClient.get<any>('/habits');
    const raw = res.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
    return list.map((h: any) => ({
      ...h,
      _id: h._id || h.id,
      id: h.id || h._id,
    }));
  },

  async getHabitById(id: string): Promise<Habit | undefined> {
    const res = await apiClient.get<any>(`/habits/${id}`);
    const raw = res.data;
    const h = (raw && raw.data !== undefined) ? raw.data : raw;
    if (!h) return undefined;
    return {
      ...h,
      _id: h._id || h.id,
      id: h.id || h._id,
    };
  },

  async createHabit(habitData: Partial<Habit>): Promise<Habit> {
    const res = await apiClient.post<any>('/habits', habitData);
    const raw = res.data;
    const h = (raw && raw.data !== undefined) ? raw.data : raw;
    return {
      ...h,
      _id: h._id || h.id,
      id: h.id || h._id,
    };
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const res = await apiClient.put<any>(`/habits/${id}`, updates);
    const raw = res.data;
    const h = (raw && raw.data !== undefined) ? raw.data : raw;
    return {
      ...h,
      _id: h._id || h.id,
      id: h.id || h._id,
    };
  },

  async deleteHabit(id: string): Promise<boolean> {
    await apiClient.delete(`/habits/${id}`);
    return true;
  },
};

export default habitApi;
