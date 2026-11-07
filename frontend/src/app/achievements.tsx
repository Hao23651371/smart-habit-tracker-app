import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  BadgeItem,
} from '../components';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { useAchievements } from '../hooks/useAchievements';
import { useStats } from '../hooks/useStats';
import { AchievementGroup } from '../types';

const GROUP_LABELS: Record<AchievementGroup, string> = {
  start: 'Khởi đầu mới',
  streak: 'Duy trì chuỗi ngày liên tiếp',
  total: 'Tổng số lần hoàn thành',
  special: 'Cột mốc đặc biệt',
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, userAchievements } = useAchievements();
  const { stats } = useStats();

  const unlockedIdSet = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievementId)),
    [userAchievements]
  );

  const currentStreak = stats?.currentStreak ?? 0;
  const totalCompleted = stats?.totalCompleted ?? 0;

  // Nhóm các huy hiệu
  const groupedAchievements = useMemo(() => {
    const groups: Partial<Record<AchievementGroup, typeof achievements>> = {
      start: [],
      streak: [],
      total: [],
      special: [],
    };
    for (const ach of achievements) {
      if (!groups[ach.group]) groups[ach.group] = [];
      groups[ach.group]!.push(ach);
    }
    return groups;
  }, [achievements]);

  // Tính tiến độ hiện tại cho từng loại huy hiệu
  const getProgressForAchievement = (ach: (typeof achievements)[0]): number => {
    if (ach.condition.type === 'STREAK') return currentStreak;
    if (ach.condition.type === 'TOTAL_DONE') return totalCompleted;
    if (ach.condition.type === 'FIRST_HABIT') return 1;
    if (ach.condition.type === 'PERFECT_DAY') return stats?.perfectDaysCount || 0;
    return 0;
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Bảng thành tích"
        showBack
        onBackPress={() => router.back()}
      />

      {/* Card tiến độ tổng quan */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Huy hiệu đã mở khoá</Text>
          <Text style={styles.summaryCount}>
            {userAchievements.length}/{achievements.length}
          </Text>
          <Text style={styles.summarySubtext}>
            Đã mở {Math.round((userAchievements.length / (achievements.length || 1)) * 100)}% toàn bộ huy hiệu
          </Text>
        </View>

        <View style={styles.streakBadgeBox}>
          <Text style={styles.streakBadgeIcon}>🔥</Text>
          <Text style={styles.streakBadgeValue}>{currentStreak}</Text>
          <Text style={styles.streakBadgeLabel}>Ngày liên tiếp</Text>
        </View>
      </View>

      {/* Danh sách nhóm huy hiệu */}
      {(['start', 'streak', 'total', 'special'] as AchievementGroup[]).map((groupKey) => {
        const list = groupedAchievements[groupKey] || [];
        if (list.length === 0) return null;

        return (
          <View key={groupKey} style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>{GROUP_LABELS[groupKey]}</Text>
              <Text style={styles.groupCountBadge}>
                {list.filter((a) => unlockedIdSet.has(a._id)).length}/{list.length}
              </Text>
            </View>

            <View style={styles.badgesGrid}>
              {list.map((ach) => (
                <View key={ach._id} style={styles.gridItem}>
                  <BadgeItem
                    achievement={ach}
                    isUnlocked={unlockedIdSet.has(ach._id)}
                    currentProgress={getProgressForAchievement(ach)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.card,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  streakBadgeBox: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  streakBadgeIcon: {
    fontSize: 22,
  },
  streakBadgeValue: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: '#D97706',
  },
  streakBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
});
