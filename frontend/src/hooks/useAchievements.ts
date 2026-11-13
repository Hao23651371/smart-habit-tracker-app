import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { achievementApi } from '../api/achievementApi';
import { DEFAULT_ACHIEVEMENTS } from '../constants/achievements';
import { useHabits } from './useHabits';
import { useLogs } from './useLogs';
import { useStats } from './useStats';
import { calculateHabitStreak } from '../utils/date';
import { Achievement, UserAchievement } from '../types';

export function useAchievements() {
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { stats } = useStats();

  const allAchievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementApi.getAchievements,
    placeholderData: DEFAULT_ACHIEVEMENTS,
  });

  const userAchievementsQuery = useQuery({
    queryKey: ['user-achievements'],
    queryFn: achievementApi.getUserAchievements,
  });

  const achievements: Achievement[] = useMemo(() => {
    const apiData = allAchievementsQuery.data;
    if (Array.isArray(apiData) && apiData.length > 0) {
      return apiData;
    }
    return DEFAULT_ACHIEVEMENTS;
  }, [allAchievementsQuery.data]);

  // Đánh giá tự động các thành tích người dùng đã mở khoá dựa trên dữ liệu thực tế
  const evaluatedUserAchievements: UserAchievement[] = useMemo(() => {
    if (userAchievementsQuery.data && userAchievementsQuery.data.length > 0) {
      return userAchievementsQuery.data;
    }

    const unlocked: UserAchievement[] = [];
    const totalHabits = habits.length;
    const totalDone = stats?.totalCompleted ?? logs.filter((l) => l.status === 'done').length;
    const maxOverallStreak = Math.max(stats?.longestStreak ?? 0, stats?.currentStreak ?? 0);

    // Tính streak cao nhất cho thói quen uống nước
    let maxWaterStreak = 0;
    for (const h of habits) {
      const isWater =
        h.title.toLowerCase().includes('nước') ||
        h.title.toLowerCase().includes('nuoc') ||
        h.categoryCode === 'health';
      if (isWater) {
        const strk = calculateHabitStreak(h._id, logs);
        if (strk > maxWaterStreak) maxWaterStreak = strk;
      }
    }

    // Tính streak cho thói quen buổi trưa
    let maxNoonStreak = 0;
    for (const h of habits) {
      if (h.timeSlot === 'noon') {
        const strk = calculateHabitStreak(h._id, logs);
        if (strk > maxNoonStreak) maxNoonStreak = strk;
      }
    }

    const perfectDays = stats?.perfectDaysCount ?? 0;

    for (const ach of achievements) {
      let isEligible = false;
      const cond = ach.condition;
      if (!cond) continue;

      const targetVal = cond.value || 1;

      switch (cond.type) {
        case 'FIRST_HABIT':
          isEligible = totalHabits >= targetVal;
          break;
        case 'TOTAL_DONE':
          isEligible = totalDone >= targetVal;
          break;
        case 'STREAK':
          // Ràng buộc: Dưới 3 ngày không tính là streak. Từ 3 ngày trở đi mới tính.
          isEligible = maxOverallStreak >= Math.max(3, targetVal);
          break;
        case 'WATER_STREAK':
          isEligible = maxWaterStreak >= targetVal;
          break;
        case 'NOON_STREAK':
          isEligible = maxNoonStreak >= targetVal;
          break;
        case 'PERFECT_DAY':
        case 'PERFECT_WEEK':
          isEligible = perfectDays >= targetVal;
          break;
        default:
          break;
      }

      if (isEligible) {
        unlocked.push({
          _id: `ua_${ach.code.toLowerCase()}`,
          userId: 'currentUser',
          achievementId: ach._id,
          unlockedAt: new Date().toISOString(),
          achievement: ach,
        });
      }
    }

    return unlocked;
  }, [userAchievementsQuery.data, habits, logs, stats, achievements]);

  const unlockedIdSet = useMemo(
    () => new Set(evaluatedUserAchievements.map((ua) => ua.achievementId)),
    [evaluatedUserAchievements]
  );

  const unlockedCodeSet = useMemo(
    () => new Set(evaluatedUserAchievements.map((ua) => ua.achievement?.code || ua.achievementId)),
    [evaluatedUserAchievements]
  );

  const isUnlocked = (achIdOrCode: string) => {
    return (
      unlockedIdSet.has(achIdOrCode) ||
      unlockedCodeSet.has(achIdOrCode) ||
      evaluatedUserAchievements.some(
        (ua) => ua.achievementId === achIdOrCode || ua.achievement?.code === achIdOrCode
      )
    );
  };

  const getProgress = (ach: Achievement) => {
    const totalHabits = habits.length;
    const totalDone = stats?.totalCompleted ?? logs.filter((l) => l.status === 'done').length;
    const maxOverallStreak = Math.max(stats?.longestStreak ?? 0, stats?.currentStreak ?? 0);
    const target = ach.condition.value;

    let current = 0;
    switch (ach.condition.type) {
      case 'FIRST_HABIT':
        current = totalHabits;
        break;
      case 'TOTAL_DONE':
        current = totalDone;
        break;
      case 'STREAK':
        current = maxOverallStreak;
        break;
      case 'WATER_STREAK': {
        const waterStreaks = habits
          .filter((h) => h.title.toLowerCase().includes('nước') || h.categoryCode === 'health')
          .map((h) => calculateHabitStreak(h._id, logs));
        current = waterStreaks.length > 0 ? Math.max(...waterStreaks) : 0;
        break;
      }
      case 'NOON_STREAK': {
        const noonStreaks = habits
          .filter((h) => h.timeSlot === 'noon')
          .map((h) => calculateHabitStreak(h._id, logs));
        current = noonStreaks.length > 0 ? Math.max(...noonStreaks) : 0;
        break;
      }
      case 'PERFECT_DAY':
      case 'PERFECT_WEEK':
        current = stats?.perfectDaysCount ?? 0;
        break;
      default:
        current = 0;
    }

    const percent = Math.min(100, Math.round((current / (target || 1)) * 100));
    const unlocked = isUnlocked(ach._id) || isUnlocked(ach.code) || current >= target;

    return {
      current,
      target,
      percent,
      isUnlocked: unlocked,
    };
  };

  return {
    achievements,
    userAchievements: evaluatedUserAchievements,
    unlockedIdSet,
    unlockedCodeSet,
    isUnlocked,
    getProgress,
    isLoading: allAchievementsQuery.isLoading || userAchievementsQuery.isLoading,
  };
}
