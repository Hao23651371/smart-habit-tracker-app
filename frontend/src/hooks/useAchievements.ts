import { useQuery } from '@tanstack/react-query';
import { achievementApi } from '../api/achievementApi';

export function useAchievements() {
  const allAchievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementApi.getAchievements,
  });

  const userAchievementsQuery = useQuery({
    queryKey: ['user-achievements'],
    queryFn: achievementApi.getUserAchievements,
  });

  return {
    achievements: allAchievementsQuery.data || [],
    userAchievements: userAchievementsQuery.data || [],
    isLoading: allAchievementsQuery.isLoading || userAchievementsQuery.isLoading,
  };
}
