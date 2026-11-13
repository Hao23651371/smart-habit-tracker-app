import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  ScrollView,
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
  BottomSheet,
  CelebrationModal,
  AchievementUnlockModal,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { useStats } from '../../hooks/useStats';
import { useAchievements } from '../../hooks/useAchievements';
import { useAppSelector } from '../../store/store';
import { formatDate, getGreeting, getVietnameseDateText, calculateHabitStreak } from '../../utils/date';
import { Achievement } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const { user } = useAppSelector((state) => state.auth);
  const { habits, isLoading: loadingHabits } = useHabits();
  const { logs, toggleCheck, isLoading: loadingLogs } = useLogs();
  const { stats } = useStats();
  const { achievements, userAchievements, isUnlocked } = useAchievements();

  const [activeSlot, setActiveSlot] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [unlockedAchievementAlert, setUnlockedAchievementAlert] = useState<Achievement | null>(null);
  const todayStr = formatDate();

  // 1. Lọc thói quen active
  const activeHabits = useMemo(() => {
    return habits.filter((h) => h.status === 'active');
  }, [habits]);

  // 2. Lọc thói quen CẦN LÀM HÔM NAY (sắp xếp hợp lý theo thứ tự giờ trong ngày Sáng -> Trưa -> Chiều -> Tối):
  const todayHabits = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const filtered = activeHabits.filter((h) => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekly' && h.daysOfWeek) {
        return h.daysOfWeek.includes(currentDayOfWeek);
      }
      return false;
    });

    // Sắp xếp theo giờ nhắc nhở để buổi sáng hiển thị trước, rồi đến trưa, chiều, tối
    return [...filtered].sort((a, b) => {
      const timeA = a.reminderTime || '12:00';
      const timeB = b.reminderTime || '12:00';
      return timeA.localeCompare(timeB);
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

  // 4. Danh sách thông báo cho quả chuông (Chỉ trong ngày hôm nay, hiển thị cả đã hoàn thành, bỏ lỡ và sắp tới):
  const notificationList = useMemo(() => {
    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();

    return todayHabits
      .map((habit) => {
        const isDone = doneHabitIds.has(habit._id);

        let rHour = 8;
        let rMin = 0;
        if (habit.reminderTime && habit.reminderTime.includes(':')) {
          const parts = habit.reminderTime.split(':');
          rHour = parseInt(parts[0], 10) || 8;
          rMin = parseInt(parts[1], 10) || 0;
        }
        const reminderTotalMin = rHour * 60 + rMin;
        const isMissed = !isDone && currentTotalMin > reminderTotalMin;

        if (isDone) {
          return {
            habit,
            type: 'completed' as const,
            title: habit.title,
            time: habit.reminderTime || 'Hôm nay',
            message: 'Đã hoàn thành xuất sắc nhiệm vụ hôm nay!',
          };
        }

        if (isMissed) {
          return {
            habit,
            type: 'missed' as const,
            title: habit.title,
            time: habit.reminderTime || 'Hôm nay',
            message: `Đã qua giờ (${habit.reminderTime}) mà chưa hoàn thành. Hãy tranh thủ làm nhé!`,
          };
        }

        return {
          habit,
          type: 'upcoming' as const,
          title: habit.title,
          time: habit.reminderTime || 'Hôm nay',
          message: `Sắp tới giờ thực hiện (${habit.reminderTime}). Hãy chuẩn bị sẵn sàng!`,
        };
      })
      .sort((a, b) => {
        // Ưu tiên hiển thị: Bỏ lỡ -> Sắp tới -> Đã hoàn thành
        const priority = { missed: 0, upcoming: 1, completed: 2 };
        if (priority[a.type] !== priority[b.type]) {
          return priority[a.type] - priority[b.type];
        }
        return (a.habit.reminderTime || '').localeCompare(b.habit.reminderTime || '');
      });
  }, [todayHabits, doneHabitIds]);

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
      const willBeDone = !doneHabitIds.has(habitId);
      const prevUnlockedSet = new Set(
        userAchievements.map((ua) => ua.achievement?.code || ua.achievementId)
      );

      await toggleCheck({ habitId, date: todayStr });

      // Nếu người dùng vừa hoàn thành một thói quen (tick done)
      if (willBeDone) {
        const currentHabit = habits.find((h) => h._id === habitId);
        const currentHabitStreak = calculateHabitStreak(habitId, logs, todayStr) + 1;
        const newTotalDone = (stats?.totalCompleted ?? logs.filter((l) => l.status === 'done').length) + 1;
        const newMaxStreak = Math.max(
          stats?.longestStreak ?? 0,
          stats?.currentStreak ?? 0,
          currentHabitStreak
        );
        const isWaterHabit =
          Boolean(currentHabit?.title.toLowerCase().includes('nước')) ||
          Boolean(currentHabit?.title.toLowerCase().includes('nuoc')) ||
          currentHabit?.categoryCode === 'health';
        const isPerfectDay = doneCount + 1 >= totalToday && totalToday > 0;

        // Tìm thành tích mới nhất vừa đủ điều kiện mở khoá
        let newlyUnlocked: Achievement | null = null;
        for (const ach of achievements) {
          if (prevUnlockedSet.has(ach.code) || prevUnlockedSet.has(ach._id)) {
            continue;
          }
          const cond = ach.condition;
          if (!cond) continue;
          const targetVal = cond.value || 1;
          let satisfied = false;

          switch (cond.type) {
            case 'FIRST_CHECKIN':
              satisfied = newTotalDone >= 1;
              break;
            case 'TOTAL_DONE':
              satisfied = newTotalDone >= targetVal;
              break;
            case 'STREAK':
              // Ràng buộc Streak: Dưới 3 ngày không tính, từ 3 ngày trở đi mới tính
              satisfied = newMaxStreak >= Math.max(3, targetVal);
              break;
            case 'WATER_STREAK':
              satisfied = isWaterHabit && currentHabitStreak >= targetVal;
              break;
            case 'NOON_STREAK':
              satisfied = currentHabit?.timeSlot === 'noon' && currentHabitStreak >= targetVal;
              break;
            case 'PERFECT_DAY':
              satisfied = isPerfectDay;
              break;
            case 'PERFECT_WEEK':
              satisfied = (stats?.perfectDaysCount ?? 0) + 1 >= 7;
              break;
            default:
              break;
          }

          if (satisfied) {
            newlyUnlocked = ach;
            break;
          }
        }

        if (newlyUnlocked) {
          // Bật thông báo rực rỡ chúc mừng mở khoá thành tích mới
          setUnlockedAchievementAlert(newlyUnlocked);
        } else if (isPerfectDay) {
          // Nếu hoàn thành 100% tất cả nhiệm vụ trong ngày -> Kích hoạt nổ pháo hoa chúc mừng
          setShowCelebration(true);
        }
      }
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
          onPress={() => setShowNotifications(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="bell" size={20} color={colors.textPrimary} />
          {notificationList.filter((n) => n.type !== 'completed').length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {notificationList.filter((n) => n.type !== 'completed').length}
              </Text>
            </View>
          )}
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

      {/* Modal danh sách thông báo nhắc nhở (chỉ để xem, không chọn được) */}
      <BottomSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        title={`Thông báo thói quen hôm nay (${notificationList.length})`}
      >
        {notificationList.length === 0 ? (
          <View style={styles.emptyNotifBox}>
            <Feather name="bell-off" size={40} color={colors.textMuted} />
            <Text style={styles.emptyNotifTitle}>Không có thông báo nào</Text>
            <Text style={styles.emptyNotifSubtitle}>
              Hôm nay bạn chưa có lịch thói quen nào cần nhắc nhở.
            </Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10, paddingVertical: 6 }}>
              {notificationList.map(({ habit, type, title, time, message }) => {
                const isCompleted = type === 'completed';
                const isMissed = type === 'missed';

                const cardBg = isCompleted
                  ? styles.notifCardCompleted
                  : isMissed
                  ? styles.notifCardMissed
                  : styles.notifCardUpcoming;

                const iconBg = isCompleted ? '#DCFCE7' : isMissed ? '#FEE2E2' : '#EDE9FE';
                const iconColor = isCompleted ? '#16A34A' : isMissed ? '#EF4444' : '#7C5CFC';
                const iconName = isCompleted ? 'check-circle' : isMissed ? 'alert-circle' : 'clock';

                const badgeBg = isCompleted ? '#22C55E' : isMissed ? '#EF4444' : '#7C5CFC';
                const badgeText = isCompleted
                  ? `Đã xong · ${time}`
                  : isMissed
                  ? `Bỏ lỡ · ${time}`
                  : `Sắp tới · ${time}`;

                return (
                  <View key={habit._id} style={[styles.notifCard, cardBg]}>
                    <View style={[styles.notifIconBox, { backgroundColor: iconBg }]}>
                      <Feather name={iconName as any} size={20} color={iconColor} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <View style={[styles.notifBadge, { backgroundColor: badgeBg }]}>
                          <Text style={styles.notifBadgeText}>{badgeText}</Text>
                        </View>
                      </View>
                      <Text style={styles.notifDesc}>{message}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </BottomSheet>

      {/* Hiệu ứng nổ pháo hoa chúc mừng khi hoàn thành 100% mục tiêu hôm nay */}
      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      {/* Modal thông báo đạt thành tích mới đầy màu sắc & rực rỡ */}
      <AchievementUnlockModal
        achievement={unlockedAchievementAlert}
        visible={Boolean(unlockedAchievementAlert)}
        onClose={() => setUnlockedAchievementAlert(null)}
        onViewAchievements={() => router.push('/achievements' as any)}
      />
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
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyNotifBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyNotifTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyNotifSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    gap: 12,
  },
  notifCardMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  notifCardUpcoming: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  notifBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  notifDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  notifCheckBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
