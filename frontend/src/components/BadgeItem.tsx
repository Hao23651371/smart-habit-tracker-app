import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { Achievement } from '../types';

export interface BadgeItemProps {
  achievement: Achievement;
  isUnlocked: boolean;
  currentProgress?: number;
}

export const BadgeItem: React.FC<BadgeItemProps> = ({
  achievement,
  isUnlocked,
  currentProgress = 0,
}) => {
  const targetValue = achievement.condition.value;
  const progressPercent = isUnlocked
    ? 100
    : Math.min(Math.round((currentProgress / targetValue) * 100), 99);

  return (
    <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
      {/* Icon huy hiệu */}
      <View
        style={[
          styles.iconContainer,
          isUnlocked ? styles.iconUnlocked : styles.iconLocked,
        ]}
      >
        <Feather
          name={isUnlocked ? (achievement.icon as any) || 'award' : 'lock'}
          size={24}
          color={isUnlocked ? '#FFFFFF' : colors.textMuted}
        />
      </View>

      <Text
        style={[styles.name, !isUnlocked && styles.nameLocked]}
        numberOfLines={1}
      >
        {achievement.name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {achievement.description}
      </Text>

      {/* Tiến độ nếu chưa mở */}
      {!isUnlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentProgress}/{targetValue}
          </Text>
        </View>
      )}

      {isUnlocked && (
        <View style={styles.unlockedTag}>
          <Feather name="check" size={12} color={colors.success} style={{ marginRight: 2 }} />
          <Text style={styles.unlockedText}>Đã đạt</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.card,
  },
  cardLocked: {
    backgroundColor: '#F9F9FC',
    borderColor: '#ECEAF5',
    opacity: 0.85,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconUnlocked: {
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  iconLocked: {
    backgroundColor: '#E5E3EF',
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  nameLocked: {
    color: colors.textSecondary,
  },
  description: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E3EF',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
    marginTop: 4,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
});

export default BadgeItem;
