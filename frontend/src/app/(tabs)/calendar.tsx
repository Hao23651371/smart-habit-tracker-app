import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  SegmentedControl,
  StatCard,
  Skeleton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { useStats } from '../../hooks/useStats';
import { formatDate, getVietnameseDateText } from '../../utils/date';

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const { habits, isLoading: loadingHabits } = useHabits();
  const { logs, isLoading: loadingLogs } = useLogs();
  const { stats } = useStats();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Lịch, 1: Thống kê
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');

  // Tính theo ngày hiện tại linh hoạt (new Date()), không gắn cứng
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [statsPeriod, setStatsPeriod] = useState<number>(0); // 0: Tuần, 1: Tháng, 2: 3 tháng

  const todayStr = formatDate(new Date());
  const activeHabits = useMemo(() => habits.filter((h) => h.status === 'active'), [habits]);

  // Điều hướng tháng
  const handlePrevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  const currentMonthYearTitle = `Tháng ${viewDate.getMonth() + 1}, ${viewDate.getFullYear()}`;

  // Tạo lưới ngày của tháng đang xem linh hoạt
  const { daysInMonth, firstDayOffset } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: string[] = [];

    for (let d = 1; d <= totalDays; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    // Xác định thứ của ngày mùng 1 (0: CN, 1: T2..6: T7) -> offset theo chuẩn T2..CN
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    return { daysInMonth: days, firstDayOffset: offset };
  }, [viewDate]);

  // Map ngày -> trạng thái hoàn thành ('full' | 'partial' | 'missed' | 'future')
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, 'full' | 'partial' | 'missed' | 'future'>();
    const totalHabitsCount = activeHabits.length || 1;

    for (const d of daysInMonth) {
      if (d > todayStr) {
        map.set(d, 'future');
        continue;
      }

      // Lọc log của ngày
      const dayLogs = logs.filter((l) => {
        const matchHabit = selectedHabitFilter === 'all' || l.habitId === selectedHabitFilter;
        return l.date === d && matchHabit;
      });

      const doneCount = dayLogs.filter((l) => l.status === 'done').length;
      const targetCount = selectedHabitFilter === 'all' ? Math.min(totalHabitsCount, 5) : 1;

      if (doneCount >= targetCount) {
        map.set(d, 'full');
      } else if (doneCount > 0) {
        map.set(d, 'partial');
      } else {
        map.set(d, 'missed');
      }
    }
    return map;
  }, [daysInMonth, logs, activeHabits, todayStr, selectedHabitFilter]);

  // Danh sách thói quen của ngày được chọn
  const selectedDayItems = useMemo(() => {
    return activeHabits.map((h) => {
      const log = logs.find((l) => l.habitId === h._id && l.date === selectedDate);
      return {
        habit: h,
        isDone: log?.status === 'done',
        isSkipped: log?.status === 'skipped',
      };
    });
  }, [activeHabits, logs, selectedDate]);

  // Dữ liệu biểu đồ cột tuần (7 ngày)
  const chartData = useMemo(() => {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const values = [80, 100, 60, 100, 80, 100, 60];
    return days.map((day, idx) => ({ day, value: values[idx] }));
  }, []);

  if (loadingHabits || loadingLogs) {
    return (
      <ScreenContainer>
        <AppHeader title="Lịch & Thống kê" />
        <Skeleton height={44} style={{ marginBottom: 16 }} />
        <Skeleton height={280} style={{ marginBottom: 16 }} />
      </ScreenContainer>
    );
  }

  // ===================== MỤC 1: LỊCH =====================
  const calendarSection = (
    <View style={styles.sectionWrapper}>
      {/* Chọn thói quen lọc */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          onPress={() => setSelectedHabitFilter('all')}
          style={[
            styles.filterPill,
            selectedHabitFilter === 'all' && styles.filterPillActive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedHabitFilter === 'all' && styles.filterPillTextActive,
            ]}
          >
            Tất cả thói quen
          </Text>
        </TouchableOpacity>

        {activeHabits.map((h) => (
          <TouchableOpacity
            key={h._id}
            onPress={() => setSelectedHabitFilter(h._id)}
            style={[
              styles.filterPill,
              selectedHabitFilter === h._id && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedHabitFilter === h._id && styles.filterPillTextActive,
              ]}
              numberOfLines={1}
            >
              {h.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Điều hướng tháng linh hoạt */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{currentMonthYearTitle}</Text>
        <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
          <Feather name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.calendarLayout, isWide && styles.calendarLayoutWide]}>
        {/* Lưới lịch tháng */}
        <View style={[styles.calendarCard, isWide && { flex: 1.3 }]}>
          {/* Hàng thứ */}
          <View style={styles.weekDaysHeader}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <Text key={d} style={styles.weekDayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Các ô ngày với offset căn đúng thứ */}
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <View key={`empty_${idx}`} style={styles.dayCellEmpty} />
            ))}

            {daysInMonth.map((dateStr) => {
              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const status = dateStatusMap.get(dateStr) || 'future';
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              let cellBg = 'transparent';
              let textColor: string = colors.textPrimary;

              if (status === 'full') {
                cellBg = colors.success;
                textColor = '#FFFFFF';
              } else if (status === 'partial') {
                cellBg = colors.primaryLight;
                textColor = colors.primary;
              } else if (status === 'missed') {
                cellBg = colors.missedLight;
                textColor = '#B91C1C';
              } else if (status === 'future') {
                textColor = colors.textMuted;
              }

              return (
                <TouchableOpacity
                  key={dateStr}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(dateStr)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: cellBg },
                    isToday && styles.todayBorder,
                    isSelected && styles.selectedBorder,
                  ]}
                >
                  <Text style={[styles.dayNumberText, { color: textColor }]}>
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chú thích màu */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Đầy đủ</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primaryLight }]} />
              <Text style={styles.legendText}>Một phần</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.missedLight }]} />
              <Text style={styles.legendText}>Bỏ lỡ</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: colors.primary }]} />
              <Text style={styles.legendText}>Hôm nay</Text>
            </View>
          </View>
        </View>

        {/* Cột chi tiết ngày (Bên phải khi rộng) */}
        <View style={[styles.dayDetailCol, isWide && { flex: 1 }]}>
          {/* 3 StatCard */}
          <View style={styles.statsRow}>
            <StatCard
              label="Ngày hoàn hảo"
              value={stats?.perfectDaysCount ?? 0}
              icon="check-circle"
              color={colors.success}
            />
            <StatCard
              label="Streak kỷ lục"
              value={`🔥 ${stats?.longestStreak ?? 0}`}
              icon="flame"
              color={colors.warning}
            />
            <StatCard
              label="Tỉ lệ"
              value={`${stats?.completionRate ?? 0}%`}
              icon="pie-chart"
              color={colors.primary}
            />
          </View>

          {/* Chi tiết ngày được chọn */}
          <View style={styles.dayDetailCard}>
            <Text style={styles.dayDetailTitle}>
              Chi tiết {getVietnameseDateText(selectedDate)}
            </Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {selectedDayItems.map(({ habit, isDone }) => (
                <View key={habit._id} style={styles.dayHabitRow}>
                  <View
                    style={[
                      styles.dayCheckIcon,
                      isDone ? styles.dayCheckIconDone : styles.dayCheckIconMissed,
                    ]}
                  >
                    <Feather
                      name={isDone ? 'check' : 'x'}
                      size={14}
                      color={isDone ? colors.success : '#EF4444'}
                    />
                  </View>
                  <Text style={styles.dayHabitName}>{habit.title}</Text>
                  <Text style={styles.dayHabitTime}>{habit.reminderTime}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // ===================== MỤC 2: THỐNG KÊ =====================
  const statsSection = (
    <View style={styles.sectionWrapper}>
      {/* Chọn khoảng: Tuần | Tháng | 3 tháng */}
      <SegmentedControl
        tabs={['Tuần này', 'Tháng này', '3 tháng']}
        selectedIndex={statsPeriod}
        onChange={setStatsPeriod}
      />

      {/* Tỉ lệ hoàn thành lớn + tổng số lần check-in */}
      <View style={styles.bigStatCard}>
        <Text style={styles.bigStatLabel}>Tỉ lệ hoàn thành trung bình</Text>
        <Text style={styles.bigStatPercent}>{stats?.completionRate ?? 0}%</Text>
        <Text style={styles.bigStatSubtext}>
          Đã thực hiện tổng cộng <Text style={{ fontWeight: '700', color: colors.primary }}>{stats?.totalCompleted ?? 0}</Text> lần check-in
        </Text>
      </View>

      {/* Biểu đồ cột theo ngày */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Tiến độ theo ngày trong tuần</Text>
        <View style={styles.chartBarsContainer}>
          {chartData.map((item, idx) => (
            <View key={idx} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${item.value}%`,
                      backgroundColor: item.value >= 80 ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.day}</Text>
              <Text style={styles.barPercent}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Thẻ Thói quen tốt nhất & Hay bỏ lỡ nhất */}
      <View style={styles.bestWorstRow}>
        <View style={[styles.bestWorstCard, { borderColor: '#86EFAC' }]}>
          <View style={[styles.bwIcon, { backgroundColor: colors.successLight }]}>
            <Feather name="thumbs-up" size={18} color={colors.success} />
          </View>
          <Text style={styles.bwTitle}>Tốt nhất</Text>
          <Text style={styles.bwHabitName} numberOfLines={2}>
            Uống nước ấm sau khi dậy
          </Text>
          <Text style={styles.bwRate}>100% hoàn thành</Text>
        </View>

        <View style={[styles.bestWorstCard, { borderColor: '#FCA5A5' }]}>
          <View style={[styles.bwIcon, { backgroundColor: colors.missedLight }]}>
            <Feather name="alert-triangle" size={18} color="#EF4444" />
          </View>
          <Text style={styles.bwTitle}>Cần cố gắng</Text>
          <Text style={styles.bwHabitName} numberOfLines={2}>
            Đọc 5 trang sách
          </Text>
          <Text style={styles.bwRate}>65% hoàn thành</Text>
        </View>
      </View>

      {/* Thẻ nhận xét ngắn từ AI */}
      <View style={styles.aiInsightCard}>
        <View style={styles.aiInsightHeader}>
          <Feather name="zap" size={18} color={colors.primary} />
          <Text style={styles.aiInsightTitle}>Nhận xét từ Trợ lý AI</Text>
        </View>
        <Text style={styles.aiInsightBody}>
          Bạn duy trì thói quen buổi sáng rất tốt! Vào các buổi tối, thói quen đọc sách thường bị bỏ lỡ vào cuối tuần. Hãy thử dời giờ đọc sách lên sớm hơn 30 phút để không bị cấn giờ nghỉ ngơi nhé!
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <AppHeader title="Lịch & Thống kê" />

      {/* Chuyển đổi tab chính */}
      <SegmentedControl
        tabs={['Lịch', 'Thống kê']}
        selectedIndex={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 0 ? calendarSection : statsSection}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    width: '100%',
  },
  filterScroll: {
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: colors.card,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarLayout: {
    width: '100%',
  },
  calendarLayoutWide: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: '#25233A',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dayDetailCol: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dayDetailCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.card,
  },
  dayDetailTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dayCheckIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayCheckIconDone: {
    backgroundColor: colors.successLight,
  },
  dayCheckIconMissed: {
    backgroundColor: colors.missedLight,
  },
  dayHabitName: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    flex: 1,
  },
  dayHabitTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Thống kê
  bigStatCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.card,
  },
  bigStatLabel: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  bigStatPercent: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  bigStatSubtext: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  chartTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 24,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 20,
    height: 100,
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
  },
  barPercent: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  bestWorstRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bestWorstCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1.5,
    ...shadows.card,
  },
  bwIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bwTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  bwHabitName: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 4,
    minHeight: 36,
  },
  bwRate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  aiInsightCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2DCFC',
    marginBottom: 24,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiInsightTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  aiInsightBody: {
    fontSize: fontSizes.caption + 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
