import { USE_MOCK } from '../config';
import apiClient from './client';
import { Category } from '../types';

export const categoryApi = {
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK) {
      return [];
    }
    const res = await apiClient.get<any>('/categories');
    const raw = res.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
    return list.map((c: any) => ({
      ...c,
      _id: c._id || c.id,
      id: c.id || c._id,
    }));
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const res = await apiClient.post<any>('/categories', categoryData);
    const raw = res.data;
    const c = (raw && raw.data !== undefined) ? raw.data : raw;
    return {
      ...c,
      _id: c._id || c.id,
      id: c.id || c._id,
    };
  },

  async deleteCategory(id: string): Promise<boolean> {
    await apiClient.delete(`/categories/${id}`);
    return true;
  },
};

export default categoryApi;
