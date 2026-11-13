import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { Habit } from '../types';

export interface HabitCardProps {
  habit: Habit;
  variant?: 'today' | 'list';
  isDone?: boolean;
  streak?: number;
  weekProgress?: boolean[]; // 7 ngày trong tuần
  onPress?: () => void;
  onToggleCheck?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  variant = 'today',
  isDone = false,
  streak = 0,
  weekProgress = [true, true, true, false, true, true, false],
  onPress,
  onToggleCheck,
}) => {
  const isTodayVariant = variant === 'today';

  // Format tần suất hiển thị
  const frequencyText =
    habit.frequency === 'daily'
      ? `Mỗi ngày · ${habit.reminderTime}`
      : `T2, T4, T6 · ${habit.reminderTime}`;

  // Tên buổi
  const timeSlotLabel =
    habit.timeSlot === 'morning'
      ? 'Sáng'
      : habit.timeSlot === 'noon'
      ? 'Trưa'
      : habit.timeSlot === 'afternoon'
      ? 'Chiều'
      : 'Tối';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isDone && isTodayVariant && styles.cardDone,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Icon danh mục */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${habit.color || colors.primary}1A` },
          ]}
        >
          <Feather
            name={(habit.icon as any) || 'activity'}
            size={20}
            color={habit.color || colors.primary}
          />
        </View>

        {/* Nội dung thói quen */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                isDone && isTodayVariant && styles.titleDone,
              ]}
              numberOfLines={1}
            >
              {habit.title}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{frequencyText}</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.slotBadge}>{timeSlotLabel}</Text>

            {/* Ràng buộc: Dưới 3 ngày (1, 2) không hiển thị streak; từ ngày 3 trở đi mới hiển thị */}
            {streak >= 3 && (
              <>
                <View style={styles.dotSeparator} />
                <Text style={styles.streakText}>🔥 {streak}</Text>
              </>
            )}
          </View>

          {/* Dải 7 chấm tiến độ tuần cho biến thể "list" */}
          {!isTodayVariant && (
            <View style={styles.weekProgressRow}>
              {weekProgress.map((done, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.weekDot,
                    done ? styles.weekDotDone : styles.weekDotEmpty,
                  ]}
                />
              ))}
              <Text style={styles.weekLabel}>Tuần này</Text>
            </View>
          )}
        </View>

        {/* Nút check tròn cho biến thể "today" */}
        {isTodayVariant && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleCheck}
            style={[
              styles.checkButton,
              isDone ? styles.checkButtonDone : styles.checkButtonUndone,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDone && <Feather name="check" size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardDone: {
    opacity: 0.65,
    backgroundColor: '#FAFAFD',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleDone: {
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 6,
  },
  slotBadge: {
    fontSize: fontSizes.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  streakText: {
    fontSize: fontSizes.caption,
    color: '#D97706',
    fontWeight: '700',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkButtonUndone: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  checkButtonDone: {
    backgroundColor: colors.success,
  },
  weekProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekDotDone: {
    backgroundColor: colors.success,
  },
  weekDotEmpty: {
    backgroundColor: colors.border,
  },
  weekLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 6,
  },
});

export default HabitCard;
