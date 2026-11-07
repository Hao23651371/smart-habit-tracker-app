import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logApi } from '../api/logApi';
import { formatDate } from '../utils/date';

export function useLogs() {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: logApi.getLogs,
  });

  const toggleCheckMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date?: string }) =>
      logApi.toggleHabitCheck(habitId, date || formatDate()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return {
    ...logsQuery,
    logs: logsQuery.data || [],
    toggleCheck: toggleCheckMutation.mutateAsync,
  };
}
