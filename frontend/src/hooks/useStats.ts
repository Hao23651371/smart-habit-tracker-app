import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/statsApi';

export function useStats() {
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.getStats,
  });

  return {
    ...statsQuery,
    stats: statsQuery.data,
  };
}
