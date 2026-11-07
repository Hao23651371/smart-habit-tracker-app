import { USE_MOCK } from '../config';
import apiClient from './client';
import { mockChatMessages, mockSuggestions, mockAiReplies } from '../mock/chat';
import { ChatMessage, Suggestion } from '../types';

let localChatMessages = [...mockChatMessages];

export const aiApi = {
  async getChatMessages(): Promise<ChatMessage[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 100));
      return [...localChatMessages];
    }
    const res = await apiClient.get<ChatMessage[]>('/ai/chat');
    return res.data;
  },

  async sendMessage(content: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    if (USE_MOCK) {
      const userMessage: ChatMessage = {
        _id: `msg_${Date.now()}`,
        id: `msg_${Date.now()}`,
        userId: 'usr_an_123456',
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      localChatMessages.push(userMessage);

      // Giả lập AI suy nghĩ 1.5 giây theo mục 8 đặc tả
      await new Promise((r) => setTimeout(r, 1500));

      const replyData = mockAiReplies[content] || {
        content: `Cảm ơn bạn đã chia sẻ! Để duy trì thói quen "${content.slice(0, 30)}...", hãy bắt đầu từ các bước nhỏ chỉ 2 phút mỗi ngày và gắn vào một khung giờ cố định.`,
      };

      const assistantMessage: ChatMessage = {
        _id: `msg_${Date.now() + 1}`,
        id: `msg_${Date.now() + 1}`,
        userId: 'usr_an_123456',
        role: 'assistant',
        content: replyData.content,
        actionButton: replyData.actionButton,
        createdAt: new Date().toISOString(),
      };
      localChatMessages.push(assistantMessage);

      return { userMessage, assistantMessage };
    }

    const res = await apiClient.post('/ai/chat', { content });
    return res.data;
  },

  async getSuggestions(): Promise<Suggestion[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return [...mockSuggestions];
    }
    const res = await apiClient.get<Suggestion[]>('/ai/suggestions');
    return res.data;
  },

  async clearChat(): Promise<void> {
    if (USE_MOCK) {
      localChatMessages = [mockChatMessages[0]];
      return;
    }
    await apiClient.delete('/ai/chat');
  },
};

export default aiApi;
