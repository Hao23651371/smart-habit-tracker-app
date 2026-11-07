import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';

export function useChat() {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['chat-messages'],
    queryFn: aiApi.getChatMessages,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: aiApi.getSuggestions,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => aiApi.sendMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: aiApi.clearChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    suggestions: suggestionsQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    clearChat: clearChatMutation.mutateAsync,
  };
}
