import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { ChatMessage } from '../types';

export function useChat() {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async (): Promise<ChatMessage[]> => {
      const list = await aiApi.getChatMessages();
      return (list || []).map((m: any) => ({
        ...m,
        _id: m._id || m.id || `msg_${Math.random()}`,
      }));
    },
  });

  const suggestionsQuery = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => aiApi.getSuggestions(false),
  });

  const refreshSuggestionsMutation = useMutation({
    mutationFn: () => aiApi.getSuggestions(true),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-suggestions'], data);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => aiApi.sendMessage(content),
    onSuccess: (data) => {
      if (data && data.userMessage && data.assistantMessage) {
        queryClient.setQueryData<ChatMessage[]>(['chat-messages'], (old = []) => [
          ...old,
          { ...data.userMessage, _id: data.userMessage._id || data.userMessage.id || `msg_u_${Date.now()}` },
          { ...data.assistantMessage, _id: data.assistantMessage._id || data.assistantMessage.id || `msg_a_${Date.now()}` },
        ]);
      }
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: aiApi.clearChat,
    onSuccess: () => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages'], []);
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    suggestions: suggestionsQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    isRefreshingSuggestions: refreshSuggestionsMutation.isPending,
    refreshSuggestions: refreshSuggestionsMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    clearChat: clearChatMutation.mutateAsync,
  };
}
