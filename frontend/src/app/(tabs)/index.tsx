import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  HabitCard,
  ProgressRing,
  StreakChip,
  FilterChips,
  FloatingAddButton,
  EmptyState,
  Skeleton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { useStats } from '../../hooks/useStats';
import { useAppSelector } from '../../store/store';
import { formatDate, getGreeting, getVietnameseDateText, calculateHabitStreak } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const { user } = useAppSelector((state) => state.auth);
  const { habits, isLoading: loadingHabits } = useHabits();
  const { logs, toggleCheck, isLoading: loadingLogs } = useLogs();
  const { stats } = useStats();

  const [activeSlot, setActiveSlot] = useState<string>('all');
  const todayStr = formatDate();

  // 1. Lọc thói quen active
  const activeHabits = useMemo(() => {
    return habits.filter((h) => h.status === 'active');
  }, [habits]);

  // 2. Lọc thói quen CẦN LÀM HÔM NAY:
  // - Daily: ngày nào cũng cần làm
  // - Weekly: chỉ tính khi đúng thứ trong tuần (1=T2..7=CN). Hôm nay Thứ 7 nên h_workout (T2-T4-T6) không hiện!
  const todayHabits = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    return activeHabits.filter((h) => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekly' && h.daysOfWeek) {
        return h.daysOfWeek.includes(currentDayOfWeek);
      }
      return false;
    });
  }, [activeHabits]);

  // 3. Bộ ID các thói quen cần làm hôm nay đã hoàn thành
  const doneHabitIds = useMemo(() => {
    const todayHabitIdSet = new Set(todayHabits.map((h) => h._id));
    return new Set(
      logs
        .filter((l) => l.date === todayStr && l.status === 'done' && todayHabitIdSet.has(l.habitId))
        .map((l) => l.habitId)
    );
  }, [logs, todayStr, todayHabits]);

  // 4. Lọc theo khung giờ (Tất cả | Sáng | Chiều | Tối)
  const slotOptions = useMemo(() => {
    const counts = { morning: 0, noon: 0, afternoon: 0, evening: 0 };
    for (const h of todayHabits) {
      if (h.timeSlot in counts) counts[h.timeSlot as keyof typeof counts]++;
    }

    const opts = [{ id: 'all', label: 'Tất cả', count: todayHabits.length }];
    if (counts.morning > 0) opts.push({ id: 'morning', label: 'Sáng', count: counts.morning });
    if (counts.noon > 0) opts.push({ id: 'noon', label: 'Trưa', count: counts.noon });
    if (counts.afternoon > 0) opts.push({ id: 'afternoon', label: 'Chiều', count: counts.afternoon });
    if (counts.evening > 0) opts.push({ id: 'evening', label: 'Tối', count: counts.evening });
    return opts;
  }, [todayHabits]);

  // 5. Phân loại thói quen: Chưa xong nằm trên, Đã xong nằm dưới
  const { pendingHabits, completedHabits } = useMemo(() => {
    const filtered =
      activeSlot === 'all'
        ? todayHabits
        : todayHabits.filter((h) => h.timeSlot === activeSlot);

    const pending: typeof filtered = [];
    const completed: typeof filtered = [];

    for (const h of filtered) {
      if (doneHabitIds.has(h._id)) {
        completed.push(h);
      } else {
        pending.push(h);
      }
    }

    return { pendingHabits: pending, completedHabits: completed };
  }, [todayHabits, doneHabitIds, activeSlot]);

  // 6. Số lượng hôm nay: đúng 3/5
  const totalToday = todayHabits.length;
  const doneCount = doneHabitIds.size;
  const progressPercent = totalToday > 0 ? Math.round((doneCount / totalToday) * 100) : 0;
  const isAllDone = totalToday > 0 && doneCount === totalToday;

  const currentStreak = stats?.currentStreak ?? 0;
  const weeklyRate = stats?.weeklyRate ?? 0;

  const motivationalQuote = isAllDone
    ? '🎉 Xuất sắc! Bạn đã hoàn thành trọn vẹn mục tiêu hôm nay!'
    : doneCount === 0
    ? 'Hãy bắt đầu ngày mới với thói quen đầu tiên nhé!'
    : `Đang làm rất tốt! Còn ${totalToday - doneCount} thói quen nữa thôi.`;

  const handleToggle = async (habitId: string) => {
    try {
      await toggleCheck({ habitId, date: todayStr });
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const displayName = user?.name || user?.fullName || 'An';
  const firstName = displayName.split(' ').pop() || 'An';

  if (loadingHabits || loadingLogs) {
    return (
      <ScreenContainer>
        <Skeleton height={32} style={{ marginBottom: 12, width: 200 }} />
        <Skeleton height={120} style={{ marginBottom: 14 }} />
        <Skeleton height={50} style={{ marginBottom: 14 }} />
        <Skeleton height={80} style={{ marginBottom: 10 }} />
        <Skeleton height={80} style={{ marginBottom: 10 }} />
      </ScreenContainer>
    );
  }

  // Cột trái: Lời chào, Streak, Tiến độ, Thẻ Tuần này
  const leftColumn = (
    <View style={[styles.leftCol, isWide && styles.leftColWide]}>
      {/* Lời chào & Ngày */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>{getGreeting(firstName)}</Text>
          <Text style={styles.dateText}>{getVietnameseDateText()}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => Alert.alert('Thông báo', 'Bạn không có thông báo mới')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="bell" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Streak Chip */}
      <View style={{ marginBottom: 12 }}>
        <StreakChip streak={currentStreak} />
      </View>

      {/* Thẻ tiến độ hôm nay */}
      <View style={styles.progressCard}>
        <View style={styles.progressContent}>
          <ProgressRing progress={progressPercent} size={88} />
          <View style={styles.progressTextWrapper}>
            <Text style={styles.progressRatio}>
              Đã xong <Text style={{ color: colors.primary }}>{doneCount}/{totalToday}</Text> thói quen
            </Text>
            <Text style={styles.motivationalText}>{motivationalQuote}</Text>
          </View>
        </View>
      </View>

      {/* Thẻ tuần này 78% */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/calendar' as any)}
        style={styles.weekCard}
      >
        <View style={styles.weekCardLeft}>
          <View style={styles.weekIconBadge}>
            <Feather name="trending-up" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.weekCardTitle}>Tuần này: {weeklyRate}% hoàn thành</Text>
            <Text style={styles.weekCardSubtitle}>Xem chi tiết biểu đồ & xu hướng</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  // Cột phải: Thói quen hôm nay (bắt đầu ngang hàng từ trên cùng khi wide)
  const rightColumn = (
    <View style={[styles.rightCol, isWide && styles.rightColWide]}>
      <Text style={styles.sectionTitle}>Thói quen hôm nay</Text>

      {/* Filter Chips */}
      <FilterChips
        options={slotOptions}
        selectedId={activeSlot}
        onSelect={setActiveSlot}
      />

      {/* Danh sách thói quen */}
      {todayHabits.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="Không có thói quen cần làm"
          description="Hôm nay bạn không có lịch thói quen nào. Hãy nghỉ ngơi hoặc tạo thói quen mới!"
          actionLabel="Thêm thói quen"
          onAction={() => router.push('/habit/form' as any)}
        />
      ) : (
        <View style={styles.habitListWrap}>
          {/* 1. Chưa xong nằm trên */}
          {pendingHabits.map((h) => {
            const streak = calculateHabitStreak(h._id, logs, todayStr);
            return (
              <HabitCard
                key={h._id}
                habit={h}
                variant="today"
                isDone={false}
                streak={streak}
                onPress={() => router.push(`/habit/${h._id}` as any)}
                onToggleCheck={() => handleToggle(h._id)}
              />
            );
          })}

          {/* 2. Đã xong nằm dưới (mờ, gạch ngang) */}
          {completedHabits.map((h) => {
            const streak = calculateHabitStreak(h._id, logs, todayStr);
            return (
              <HabitCard
                key={h._id}
                habit={h}
                variant="today"
                isDone={true}
                streak={streak}
                onPress={() => router.push(`/habit/${h._id}` as any)}
                onToggleCheck={() => handleToggle(h._id)}
              />
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
        {leftColumn}
        {rightColumn}
      </View>

      {/* Floating Add Button */}
      <FloatingAddButton onPress={() => router.push('/habit/form' as any)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainLayout: {
    width: '100%',
  },
  mainLayoutWide: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  leftCol: {
    width: '100%',
    marginBottom: 14, // Thu gọn khoảng cách thừa giữa thẻ tuần và phần dưới trên mobile
  },
  leftColWide: {
    flex: 1,
    marginBottom: 0,
  },
  rightCol: {
    width: '100%',
  },
  rightColWide: {
    flex: 1.25,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  greetingText: {
    fontSize: fontSizes.title1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.card,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTextWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  progressRatio: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  motivationalText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.button,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DCFC',
  },
  weekCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  weekCardTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  weekCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  habitListWrap: {
    marginTop: 4,
    paddingBottom: 40, // Đảm bảo thẻ cuối cùng và nút check không bao giờ bị nút + che
  },
});
