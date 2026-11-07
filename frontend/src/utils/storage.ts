import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage bọc đa nền tảng (Web + Native):
 * - Native: dùng expo-secure-store (lưu trữ mã hoá an toàn)
 * - Web: dùng window.localStorage
 * Cung cấp API async: getItem, setItem, removeItem
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[storage] Error reading key "${key}":`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`[storage] Error writing key "${key}":`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`[storage] Error removing key "${key}":`, error);
    }
  },
};

export default storage;
