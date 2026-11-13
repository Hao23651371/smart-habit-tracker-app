import apiClient from './client';
import { ChatMessage, Suggestion } from '../types';

export const aiApi = {
  async getChatMessages(): Promise<ChatMessage[]> {
    const res = await apiClient.get<any>('/ai/chat');
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
  },

  async sendMessage(content: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const res = await apiClient.post<any>('/ai/chat', { content });
    const raw = res.data;
    return (raw && raw.data !== undefined) ? raw.data : raw;
  },

  async getSuggestions(refresh = false): Promise<Suggestion[]> {
    const res = await apiClient.get<any>(`/ai/suggestions?refresh=${refresh}&t=${Date.now()}`);
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data)) ? raw.data : [];
  },

  async clearChat(): Promise<void> {
    try {
      await apiClient.delete('/ai/chat');
    } catch {
      // Ignored
    }
  },
};

export default aiApi;
