import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logApi } from '../api/logApi';
import { formatDate } from '../utils/date';
import { HabitLog } from '../types';

export function useLogs() {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: logApi.getLogs,
  });

  const toggleCheckMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date?: string }) =>
      logApi.toggleHabitCheck(habitId, date || formatDate()),
    onMutate: async ({ habitId, date }) => {
      const targetDate = date || formatDate();
      await queryClient.cancelQueries({ queryKey: ['logs'] });

      const prevLogs = queryClient.getQueryData<HabitLog[]>(['logs']) || [];

      // Kiểm tra xem thói quen ngày đó đã hoàn thành chưa để cập nhật lạc quan tức thì
      const existingIndex = prevLogs.findIndex(
        (l) => l.habitId === habitId && l.date === targetDate
      );

      let nextLogs: HabitLog[];
      if (existingIndex >= 0) {
        const existing = prevLogs[existingIndex];
        if (existing.status === 'done') {
          // Bỏ hoàn thành (undone)
          nextLogs = prevLogs.filter((_, idx) => idx !== existingIndex);
        } else {
          // Đổi thành done
          nextLogs = [...prevLogs];
          nextLogs[existingIndex] = {
            ...existing,
            status: 'done',
            completedAt: new Date().toISOString(),
          };
        }
      } else {
        // Tạo log mới hoàn thành ngay
        const newLog: HabitLog = {
          _id: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          userId: 'usr_current',
          habitId,
          date: targetDate,
          status: 'done',
          currentValue: 1,
          completedAt: new Date().toISOString(),
          loggedAt: new Date().toISOString(),
        };
        nextLogs = [newLog, ...prevLogs];
      }

      queryClient.setQueryData<HabitLog[]>(['logs'], nextLogs);

      return { prevLogs };
    },
    onError: (err, variables, context) => {
      console.warn('[useLogs] toggleCheck error:', err);
    },
    onSettled: () => {
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
