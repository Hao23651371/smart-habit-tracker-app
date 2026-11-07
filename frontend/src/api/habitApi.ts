import { USE_MOCK } from '../config';
import apiClient from './client';
import { mockHabits } from '../mock/habits';
import { Habit } from '../types';

let localHabits = [...mockHabits];

export const habitApi = {
  async getHabits(): Promise<Habit[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return [...localHabits];
    }
    const res = await apiClient.get<Habit[]>('/habits');
    return res.data;
  },

  async getHabitById(id: string): Promise<Habit | undefined> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 100));
      return localHabits.find((h) => h._id === id || h.id === id);
    }
    const res = await apiClient.get<Habit>(`/habits/${id}`);
    return res.data;
  },

  async createHabit(habitData: Partial<Habit>): Promise<Habit> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const newHabit: Habit = {
        _id: `h_${Date.now()}`,
        id: `h_${Date.now()}`,
        userId: 'usr_an_123456',
        categoryId: habitData.categoryId || 'cat_health',
        categoryCode: habitData.categoryCode || 'health',
        title: habitData.title || 'Thói quen mới',
        description: habitData.description || '',
        icon: habitData.icon || 'activity',
        color: habitData.color || '#7C5CFC',
        frequency: habitData.frequency || 'daily',
        daysOfWeek: habitData.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
        reminderTime: habitData.reminderTime || '08:00',
        reminderEnabled: habitData.reminderEnabled ?? true,
        timeSlot: habitData.timeSlot || 'morning',
        goalType: habitData.goalType || 'check',
        targetValue: habitData.targetValue || 1,
        unit: habitData.unit || 'lần',
        status: 'active',
        source: habitData.source || 'manual',
        createdAt: new Date().toISOString(),
      };
      localHabits.unshift(newHabit);
      return newHabit;
    }
    const res = await apiClient.post<Habit>('/habits', habitData);
    return res.data;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const index = localHabits.findIndex((h) => h._id === id || h.id === id);
      if (index !== -1) {
        localHabits[index] = { ...localHabits[index], ...updates };
        return localHabits[index];
      }
      throw new Error('Thói quen không tồn tại');
    }
    const res = await apiClient.put<Habit>(`/habits/${id}`, updates);
    return res.data;
  },

  async deleteHabit(id: string): Promise<boolean> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      localHabits = localHabits.filter((h) => h._id !== id && h.id !== id);
      return true;
    }
    await apiClient.delete(`/habits/${id}`);
    return true;
  },
};

export default habitApi;
