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
  const { achievements, userAchievements, unlockedIdSet, isUnlocked, getProgress } = useAchievements();
  const { stats } = useStats();

  const currentStreak = stats?.currentStreak ?? 0;

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

      {/* Banner hướng dẫn ràng buộc Streak & Thành tích nước */}
      <View style={styles.ruleBanner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Feather name="info" size={15} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={styles.ruleBannerTitle}>Ràng buộc tính Streak & Thành tích:</Text>
        </View>
        <Text style={styles.ruleBannerText}>
          • <Text style={{ fontWeight: '700' }}>Ràng buộc Streak:</Text> Dưới 3 ngày liên tiếp (1, 2) chưa tính streak. Bạn cần đạt từ ngày thứ 3 liên tục trở lên để kích hoạt ngọn lửa Streak 🔥.
        </Text>
        <Text style={styles.ruleBannerText}>
          • <Text style={{ fontWeight: '700' }}>Huy hiệu Nước & Chuỗi 12 ngày:</Text> Duy trì chuỗi từ 10 - 12 ngày liên tục thực hiện thói quen (uống nước, học bài) để mở khoá huy hiệu "Kiện tướng uống nước" và "Chuỗi vàng 12 ngày"!
        </Text>
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
                {list.filter((a) => isUnlocked(a._id)).length}/{list.length}
              </Text>
            </View>

            <View style={styles.badgesGrid}>
              {list.map((ach) => {
                const prog = getProgress(ach);
                return (
                  <View key={ach._id} style={styles.gridItem}>
                    <BadgeItem
                      achievement={ach}
                      isUnlocked={prog.isUnlocked}
                      currentProgress={prog.current}
                    />
                  </View>
                );
              })}
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
    marginBottom: 16,
    ...shadows.card,
  },
  ruleBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: radii.button,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  ruleBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  ruleBannerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginTop: 3,
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
