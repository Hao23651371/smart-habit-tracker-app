import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitApi } from '../api/habitApi';
import { Habit } from '../types';

export function useHabits() {
  const queryClient = useQueryClient();

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: habitApi.getHabits,
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: Partial<Habit>) => habitApi.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) =>
      habitApi.updateHabit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => habitApi.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return {
    ...habitsQuery,
    habits: habitsQuery.data || [],
    createHabit: createHabitMutation.mutateAsync,
    updateHabit: updateHabitMutation.mutateAsync,
    deleteHabit: deleteHabitMutation.mutateAsync,
  };
}
