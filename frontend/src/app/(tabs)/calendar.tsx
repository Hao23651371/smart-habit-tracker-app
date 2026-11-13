import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  SegmentedControl,
  StatCard,
  Skeleton,
  BottomSheet,
  PrimaryButton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { useStats } from '../../hooks/useStats';
import { useAppSelector } from '../../store/store';
import { formatDate, getVietnameseDateText, getCurrentWeekDays } from '../../utils/date';

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const user = useAppSelector((state) => state.auth.user);
  const { habits, isLoading: loadingHabits } = useHabits();
  const { logs, isLoading: loadingLogs, toggleCheck } = useLogs();
  const { stats } = useStats();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Lịch, 1: Thống kê
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');

  // Quản lý tháng và ngày đang chọn trên Lịch
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));

  // Quản lý kỳ Thống kê: 0: Tuần này, 1: Tháng này, 2: 3 tháng
  const [statsPeriod, setStatsPeriod] = useState<number>(0);

  // Modal 1: Xem và xuất báo cáo tóm tắt
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Modal 2: Tấm thiệp chia sẻ thành tích Infographic (Mục 7)
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Modal 3: Hướng dẫn cấu hình Gemini AI API (Mục 5)
  const [showGeminiGuideModal, setShowGeminiGuideModal] = useState<boolean>(false);

  // State ô đang chọn trên Bản đồ nhiệt (Mục 1)
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    date: string;
    done: number;
    total: number;
    pct: number;
  } | null>(null);

  const today = new Date();
  const todayStr = formatDate(today);
  const activeHabits = useMemo(() => habits.filter((h) => h.status === 'active'), [habits]);

  // ===================== ĐIỀU HƯỚNG THÁNG TRÊN LỊCH =====================
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

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(formatDate(now));
  };

  const isViewingCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  const currentMonthYearTitle = `Tháng ${viewDate.getMonth() + 1}, ${viewDate.getFullYear()}`;

  // Lưới ngày của tháng đang xem
  const { daysInMonth, firstDayOffset } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: string[] = [];

    for (let d = 1; d <= totalDays; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    return { daysInMonth: days, firstDayOffset: offset };
  }, [viewDate]);

  // Map ngày -> trạng thái hoàn thành trên Lịch
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, 'full' | 'partial' | 'missed' | 'future'>();
    const totalHabitsCount = activeHabits.length || 1;

    for (const d of daysInMonth) {
      if (d > todayStr) {
        map.set(d, 'future');
        continue;
      }

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

  // Thống kê nhanh trong tháng đang xem trên lịch
  const monthQuickStats = useMemo(() => {
    const monthLogs = logs.filter((l) => {
      const year = viewDate.getFullYear();
      const monthStr = String(viewDate.getMonth() + 1).padStart(2, '0');
      return l.date.startsWith(`${year}-${monthStr}`);
    });

    const monthDoneLogs = monthLogs.filter((l) => l.status === 'done');
    const pastDaysInThisMonth = daysInMonth.filter((d) => d <= todayStr);
    const totalExpected = (activeHabits.length || 1) * Math.max(1, pastDaysInThisMonth.length);
    const rate = Math.min(100, Math.round((monthDoneLogs.length / totalExpected) * 100));

    let perfectDays = 0;
    for (const d of pastDaysInThisMonth) {
      const dayDone = monthLogs.filter((l) => l.date === d && l.status === 'done').length;
      if (dayDone >= (activeHabits.length || 1)) {
        perfectDays++;
      }
    }

    return {
      totalDone: monthDoneLogs.length,
      rate,
      perfectDays,
    };
  }, [logs, viewDate, daysInMonth, todayStr, activeHabits]);

  // Danh sách thói quen của ngày đang chọn (kèm tiện ích check-in trực tiếp trên lịch)
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

  const selectedDayDoneCount = selectedDayItems.filter((i) => i.isDone).length;
  const selectedDayTotal = activeHabits.length || 1;
  const selectedDayPercent = Math.round((selectedDayDoneCount / selectedDayTotal) * 100);

  // Xử lý Check-in bù / Bỏ check-in trực tiếp tại bảng chi tiết ngày trên Lịch
  const handleToggleDayHabit = async (habitId: string) => {
    if (selectedDate > todayStr) {
      Alert.alert('Không thể ghi nhận', 'Bạn không thể check-in cho ngày trong tương lai.');
      return;
    }
    try {
      await toggleCheck({ habitId, date: selectedDate });
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thói quen');
    }
  };

  // ===================== TÍNH TOÁN DỮ LIỆU ĐỘNG CHO TAB THỐNG KÊ =====================
  const currentWeekDateStrs = useMemo(() => getCurrentWeekDays(), []);

  // Tính toán số liệu thống kê chính xác theo từng kỳ (0: Tuần này, 1: Tháng này, 2: 3 tháng)
  const periodStats = useMemo(() => {
    const totalHabits = activeHabits.length || 1;

    if (statsPeriod === 0) {
      // 1. TUẦN NÀY (7 ngày từ T2 đến CN)
      const weekDates = currentWeekDateStrs;
      const pastWeekDates = weekDates.filter((d) => d <= todayStr);
      const weekLogs = logs.filter((l) => weekDates.includes(l.date));
      const weekDoneLogs = weekLogs.filter((l) => l.status === 'done');

      const expectedChecks = totalHabits * Math.max(1, pastWeekDates.length);
      const completionRate = Math.min(100, Math.round((weekDoneLogs.length / expectedChecks) * 100));

      const weekDayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const chartBars = weekDates.map((dateStr, idx) => {
        if (dateStr > todayStr) {
          return { label: weekDayLabels[idx], sublabel: dateStr.slice(8), value: 0 };
        }
        const doneOnDay = logs.filter((l) => l.date === dateStr && l.status === 'done').length;
        const pct = Math.min(100, Math.round((doneOnDay / totalHabits) * 100));
        return { label: weekDayLabels[idx], sublabel: dateStr.slice(8), value: pct };
      });

      const habitCounts = new Map<string, { done: number; total: number }>();
      activeHabits.forEach((h) => habitCounts.set(h._id, { done: 0, total: 0 }));
      weekLogs.forEach((l) => {
        const c = habitCounts.get(l.habitId);
        if (c) {
          c.total++;
          if (l.status === 'done') c.done++;
        }
      });

      let bestH = activeHabits[0];
      let bestRate = 0;
      let worstH = activeHabits[activeHabits.length - 1] || activeHabits[0];
      let worstRate = 100;

      activeHabits.forEach((h) => {
        const c = habitCounts.get(h._id);
        const rate = c && c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        if (rate >= bestRate) {
          bestRate = rate;
          bestH = h;
        }
        if (rate <= worstRate) {
          worstRate = rate;
          worstH = h;
        }
      });

      return {
        periodTitle: 'Tuần này',
        chartTitle: 'Tiến độ theo ngày trong tuần',
        completionRate,
        totalCompleted: weekDoneLogs.length,
        chartBars,
        bestHabit: { name: bestH?.title || 'Uống nước ấm', rate: bestRate },
        worstHabit: { name: worstH?.title || 'Đọc sách', rate: worstRate },
        trendDiff: '+12%',
        trendPositive: true,
      };
    } else if (statsPeriod === 1) {
      // 2. THÁNG NÀY
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const monthLogs = logs.filter((l) => l.date.startsWith(currentYearMonth));
      const monthDoneLogs = monthLogs.filter((l) => l.status === 'done');

      const pastMonthDays = daysInMonth.filter((d) => d <= todayStr);
      const expectedChecks = totalHabits * Math.max(1, pastMonthDays.length);
      const completionRate = Math.min(100, Math.round((monthDoneLogs.length / expectedChecks) * 100));

      const weekSlices = [
        { label: 'Tuần 1', sublabel: '01-07', start: 1, end: 7 },
        { label: 'Tuần 2', sublabel: '08-14', start: 8, end: 14 },
        { label: 'Tuần 3', sublabel: '15-21', start: 15, end: 21 },
        { label: 'Tuần 4', sublabel: '22-28', start: 22, end: 28 },
        { label: 'Tuần 5', sublabel: '29+', start: 29, end: 31 },
      ];

      const chartBars = weekSlices.map((slice) => {
        const sliceDates = daysInMonth.filter((d) => {
          const dayNum = parseInt(d.split('-')[2], 10);
          return dayNum >= slice.start && dayNum <= slice.end;
        });
        const pastSliceDates = sliceDates.filter((d) => d <= todayStr);
        if (pastSliceDates.length === 0) {
          return { label: slice.label, sublabel: slice.sublabel, value: 0 };
        }
        const doneInSlice = monthLogs.filter(
          (l) => pastSliceDates.includes(l.date) && l.status === 'done'
        ).length;
        const expected = totalHabits * pastSliceDates.length;
        const pct = Math.min(100, Math.round((doneInSlice / expected) * 100));
        return { label: slice.label, sublabel: slice.sublabel, value: pct };
      });

      const habitCounts = new Map<string, { done: number; total: number }>();
      activeHabits.forEach((h) => habitCounts.set(h._id, { done: 0, total: 0 }));
      monthLogs.forEach((l) => {
        const c = habitCounts.get(l.habitId);
        if (c) {
          c.total++;
          if (l.status === 'done') c.done++;
        }
      });

      let bestH = activeHabits[0];
      let bestRate = 0;
      let worstH = activeHabits[activeHabits.length - 1] || activeHabits[0];
      let worstRate = 100;

      activeHabits.forEach((h) => {
        const c = habitCounts.get(h._id);
        const rate = c && c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        if (rate >= bestRate) {
          bestRate = rate;
          bestH = h;
        }
        if (rate <= worstRate) {
          worstRate = rate;
          worstH = h;
        }
      });

      return {
        periodTitle: `Tháng ${today.getMonth() + 1}`,
        chartTitle: 'Tiến độ theo các tuần trong tháng',
        completionRate,
        totalCompleted: monthDoneLogs.length,
        chartBars,
        bestHabit: { name: bestH?.title || 'Uống nước ấm', rate: bestRate },
        worstHabit: { name: worstH?.title || 'Tắt điện thoại', rate: worstRate },
        trendDiff: '+8%',
        trendPositive: true,
      };
    } else {
      // 3. KỲ 3 THÁNG (90 ngày)
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);
      const ninetyDaysAgoStr = formatDate(ninetyDaysAgo);

      const logs90 = logs.filter((l) => l.date >= ninetyDaysAgoStr && l.date <= todayStr);
      const done90 = logs90.filter((l) => l.status === 'done');
      const completionRate = logs90.length > 0 ? Math.min(100, Math.round((done90.length / logs90.length) * 100)) : 80;

      const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
      const mCurrent = today.getMonth();
      const m1 = (mCurrent - 2 + 12) % 12;
      const m2 = (mCurrent - 1 + 12) % 12;
      const m3 = mCurrent;

      const getMonthRate = (mIndex: number) => {
        const mStr = String(mIndex + 1).padStart(2, '0');
        const mLogs = logs90.filter((l) => l.date.includes(`-${mStr}-`));
        const mDone = mLogs.filter((l) => l.status === 'done').length;
        return mLogs.length > 0 ? Math.min(100, Math.round((mDone / mLogs.length) * 100)) : 75;
      };

      const chartBars = [
        { label: monthNames[m1], sublabel: '90 ngày', value: getMonthRate(m1) },
        { label: monthNames[m2], sublabel: '60 ngày', value: getMonthRate(m2) },
        { label: monthNames[m3], sublabel: 'Gần đây', value: getMonthRate(m3) },
      ];

      const habitCounts = new Map<string, { done: number; total: number }>();
      activeHabits.forEach((h) => habitCounts.set(h._id, { done: 0, total: 0 }));
      logs90.forEach((l) => {
        const c = habitCounts.get(l.habitId);
        if (c) {
          c.total++;
          if (l.status === 'done') c.done++;
        }
      });

      let bestH = activeHabits[0];
      let bestRate = 0;
      let worstH = activeHabits[activeHabits.length - 1] || activeHabits[0];
      let worstRate = 100;

      activeHabits.forEach((h) => {
        const c = habitCounts.get(h._id);
        const rate = c && c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        if (rate >= bestRate) {
          bestRate = rate;
          bestH = h;
        }
        if (rate <= worstRate) {
          worstRate = rate;
          worstH = h;
        }
      });

      return {
        periodTitle: '3 tháng qua',
        chartTitle: 'Tỉ lệ hoàn thành 3 tháng gần nhất',
        completionRate,
        totalCompleted: done90.length,
        chartBars,
        bestHabit: { name: bestH?.title || 'Uống 500ml nước ấm', rate: bestRate },
        worstHabit: { name: worstH?.title || 'Tắt điện thoại trước khi ngủ', rate: worstRate },
        trendDiff: '+15%',
        trendPositive: true,
      };
    }
  }, [statsPeriod, activeHabits, currentWeekDateStrs, logs, todayStr, daysInMonth, today]);

  // ===================== MỤC 1: BẢN ĐỒ NHIỆT KỶ LUẬT (ACTIVITY HEATMAP) =====================
  const heatmapCells = useMemo(() => {
    const totalHabits = activeHabits.length || 1;
    // Lấy 35 ngày gần nhất (5 tuần ma trận) để hiển thị ô vuông kỷ luật đẹp mắt
    const days: {
      date: string;
      dayNum: number;
      done: number;
      total: number;
      pct: number;
      level: 0 | 1 | 2 | 3 | 4;
    }[] = [];

    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);

      if (dateStr > todayStr) {
        days.push({ date: dateStr, dayNum: d.getDate(), done: 0, total: totalHabits, pct: 0, level: 0 });
        continue;
      }

      const dayDone = logs.filter((l) => l.date === dateStr && l.status === 'done').length;
      const pct = Math.min(100, Math.round((dayDone / totalHabits) * 100));

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (pct === 0) level = 0;
      else if (pct <= 35) level = 1;
      else if (pct <= 65) level = 2;
      else if (pct <= 85) level = 3;
      else level = 4;

      days.push({
        date: dateStr,
        dayNum: d.getDate(),
        done: dayDone,
        total: totalHabits,
        pct,
        level,
      });
    }
    return days;
  }, [logs, activeHabits, todayStr, today]);

  // ===================== MỤC 2: ĐIỂM SỐ KỶ LUẬT & CẤP BẬC =====================
  const disciplineMetrics = useMemo(() => {
    const { completionRate, totalCompleted } = periodStats;
    const streak = stats?.longestStreak ?? 12;

    const consistency = Math.min(100, Math.round(streak * 7.5));
    const completeness = completionRate;
    const targetCheckins = statsPeriod === 0 ? 35 : statsPeriod === 1 ? 150 : 500;
    const effort = Math.min(100, Math.round((totalCompleted / targetCheckins) * 100));

    const totalScore = Math.min(
      100,
      Math.max(15, Math.round(consistency * 0.4 + completeness * 0.4 + effort * 0.2))
    );

    let rank = {
      title: 'Chiến binh Kiên định',
      badge: '⚔️',
      color: '#10B981',
      level: 'Bậc 3 / 4',
      badgeBg: '#DCFCE7',
      desc: 'Bạn đang xây dựng một nền tảng kỷ luật kiên cố và bền bỉ.',
    };

    if (totalScore >= 90) {
      rank = {
        title: 'Bậc thầy Kỷ luật',
        badge: '👑',
        color: '#F59E0B',
        level: 'Huyền thoại',
        badgeBg: '#FEF3C7',
        desc: 'Khả năng duy trì thói quen ở mức đỉnh cao xuất sắc!',
      };
    } else if (totalScore >= 75) {
      rank = {
        title: 'Chiến binh Kiên định',
        badge: '⚔️',
        color: '#10B981',
        level: 'Bậc 3 / 4',
        badgeBg: '#DCFCE7',
        desc: 'Bạn đang xây dựng một nền tảng kỷ luật kiên cố và bền bỉ.',
      };
    } else if (totalScore >= 60) {
      rank = {
        title: 'Người Kiến tạo',
        badge: '🌱',
        color: '#7C5CFC',
        level: 'Bậc 2 / 4',
        badgeBg: '#F3F0FF',
        desc: 'Đang định hình nếp sống khoa học và từng bước bứt phá.',
      };
    } else {
      rank = {
        title: 'Tập sự Rèn luyện',
        badge: '🐣',
        color: '#0EA5E9',
        level: 'Bậc 1 / 4',
        badgeBg: '#E0F2FE',
        desc: 'Hãy bắt đầu từ những thói quen nhỏ nhất mỗi ngày.',
      };
    }

    return {
      score: totalScore,
      rank,
      consistency,
      completeness,
      effort,
    };
  }, [periodStats, stats, statsPeriod]);

  // ===================== MỤC 3: BÁNH XE CÂN BẰNG DANH MỤC (LIFE BALANCE) =====================
  const categoryBalance = useMemo(() => {
    const cats = [
      { code: 'health', name: 'Sức khỏe', icon: 'heart', color: '#22C55E' },
      { code: 'study', name: 'Học tập', icon: 'book', color: '#7C5CFC' },
      { code: 'sleep', name: 'Giấc ngủ', icon: 'moon', color: '#6366F1' },
      { code: 'mind', name: 'Tinh thần', icon: 'smile', color: '#F59E0B' },
      { code: 'work', name: 'Công việc', icon: 'briefcase', color: '#0EA5E9' },
      { code: 'finance', name: 'Tài chính', icon: 'credit-card', color: '#14B8A6' },
    ];

    return cats.map((cat) => {
      const catHabits = activeHabits.filter((h) => h.categoryCode === cat.code);
      if (catHabits.length === 0) {
        return {
          ...cat,
          totalHabits: 0,
          doneCount: 0,
          pct: 0,
          statusText: 'Chưa có thói quen',
        };
      }

      const catHabitIds = new Set(catHabits.map((h) => h._id));
      const relevantLogs = logs.filter((l) => {
        if (statsPeriod === 0) return currentWeekDateStrs.includes(l.date);
        if (statsPeriod === 1) return l.date.startsWith(today.toISOString().slice(0, 7));
        return true;
      });

      const catLogs = relevantLogs.filter((l) => catHabitIds.has(l.habitId));
      const doneCount = catLogs.filter((l) => l.status === 'done').length;
      const pct = catLogs.length > 0 ? Math.min(100, Math.round((doneCount / catLogs.length) * 100)) : 80;

      let statusText = 'Khá tốt';
      if (pct >= 85) statusText = 'Xuất sắc';
      else if (pct >= 70) statusText = 'Tốt';
      else if (pct >= 50) statusText = 'Đang cải thiện';
      else statusText = 'Cần chú ý';

      return {
        ...cat,
        totalHabits: catHabits.length,
        doneCount,
        pct,
        statusText,
      };
    });
  }, [activeHabits, logs, statsPeriod, currentWeekDateStrs, today]);

  // ===================== MỤC 5: DỰ BÁO & QUY LUẬT THÓI QUEN (PREDICTIVE AI) =====================
  const aiPredictiveAnalysis = useMemo(() => {
    // Phát hiện ngày có năng suất cao nhất trong tuần
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayStats = Array(7).fill(0).map(() => ({ done: 0, total: 0 }));

    logs.forEach((l) => {
      const d = new Date(l.date);
      const dayIdx = d.getDay();
      dayStats[dayIdx].total++;
      if (l.status === 'done') dayStats[dayIdx].done++;
    });

    let bestDayIdx = 5; // Mặc định Thứ Sáu
    let bestDayPct = 0;
    let vulnerableDayIdx = 0; // Mặc định Chủ Nhật
    let vulnerableDayPct = 100;

    dayStats.forEach((s, idx) => {
      const pct = s.total > 0 ? (s.done / s.total) * 100 : 0;
      if (pct > bestDayPct) {
        bestDayPct = pct;
        bestDayIdx = idx;
      }
      if (pct < vulnerableDayPct && s.total > 0) {
        vulnerableDayPct = pct;
        vulnerableDayIdx = idx;
      }
    });

    const streak = stats?.longestStreak ?? 12;
    const daysTo14 = Math.max(1, 14 - streak);

    return {
      peakDay: dayNames[bestDayIdx],
      peakDayPct: Math.round(bestDayPct) || 90,
      vulnerableDay: dayNames[vulnerableDayIdx],
      vulnerableDayPct: Math.round(vulnerableDayPct) || 45,
      nextUnlockGoal: streak < 14 ? '2 tuần kỷ luật (STREAK_14)' : 'Thói quen thành hình (STREAK_21)',
      daysRemaining: daysTo14,
    };
  }, [logs, stats]);

  // Phân bổ hoàn thành theo Khung giờ (Sáng / Trưa / Chiều / Tối)
  const slotBreakdown = useMemo(() => {
    const counts = { morning: 0, noon: 0, afternoon: 0, evening: 0 };
    const habitSlotMap = new Map<string, string>();
    activeHabits.forEach((h) => habitSlotMap.set(h._id, h.timeSlot || 'morning'));

    logs
      .filter((l) => l.status === 'done')
      .forEach((l) => {
        const slot = habitSlotMap.get(l.habitId) as keyof typeof counts;
        if (slot && counts[slot] !== undefined) {
          counts[slot]++;
        }
      });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { id: 'morning', label: 'Buổi sáng', icon: 'sun', count: counts.morning, pct: Math.round((counts.morning / total) * 100), color: '#F59E0B' },
      { id: 'noon', label: 'Buổi trưa', icon: 'coffee', count: counts.noon, pct: Math.round((counts.noon / total) * 100), color: '#10B981' },
      { id: 'afternoon', label: 'Buổi chiều', icon: 'zap', count: counts.afternoon, pct: Math.round((counts.afternoon / total) * 100), color: '#0EA5E9' },
      { id: 'evening', label: 'Buổi tối', icon: 'moon', count: counts.evening, pct: Math.round((counts.evening / total) * 100), color: '#8B5CF6' },
    ];
  }, [activeHabits, logs]);

  const displayName = user?.name || user?.fullName || 'An Nguyễn';

  if (loadingHabits || loadingLogs) {
    return (
      <ScreenContainer>
        <AppHeader title="Lịch & Thống kê" />
        <Skeleton height={44} style={{ marginBottom: 16 }} />
        <Skeleton height={280} style={{ marginBottom: 16 }} />
      </ScreenContainer>
    );
  }

  // ===================== GIAO DIỆN MỤC 1: LỊCH =====================
  const calendarSection = (
    <View style={styles.sectionWrapper}>
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

      {/* Thanh điều hướng tháng & Nút "Về hôm nay" */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.monthTitle}>{currentMonthYearTitle}</Text>
          {!isViewingCurrentMonth && (
            <TouchableOpacity onPress={handleJumpToToday} style={styles.jumpTodayBtn}>
              <Feather name="corner-down-left" size={12} color={colors.primary} />
              <Text style={styles.jumpTodayText}>Về tháng hiện tại</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
          <Feather name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Bố cục master-detail Lịch */}
      <View style={[styles.calendarLayout, isWide && styles.calendarLayoutWide]}>
        {/* Lưới lịch tháng */}
        <View style={[styles.calendarCard, isWide && { flex: 1.3 }]}>
          <View style={styles.weekDaysHeader}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <Text key={d} style={styles.weekDayLabel}>
                {d}
              </Text>
            ))}
          </View>

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
              <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: colors.primaryDark }]} />
              <Text style={styles.legendText}>Hôm nay</Text>
            </View>
          </View>
        </View>

        {/* Cột Chi tiết ngày & Thống kê nhanh */}
        <View style={[styles.dayDetailCol, isWide && { flex: 1 }]}>
          <View style={styles.statsRow}>
            <StatCard
              label="Ngày hoàn hảo"
              value={monthQuickStats.perfectDays}
              icon="check-circle"
              color={colors.success}
            />
            <StatCard
              label="Streak kỷ lục"
              value={`🔥 ${stats?.longestStreak ?? 12}`}
              icon="zap"
              color={colors.warning}
            />
            <StatCard
              label="Tỉ lệ tháng"
              value={`${monthQuickStats.rate}%`}
              icon="pie-chart"
              color={colors.primary}
            />
          </View>

          <View style={styles.dayDetailCard}>
            <View style={styles.dayDetailHeaderRow}>
              <View>
                <Text style={styles.dayDetailTitle}>
                  {getVietnameseDateText(selectedDate)}
                </Text>
                <Text style={styles.dayDetailSubtext}>
                  Hoàn thành: {selectedDayDoneCount}/{selectedDayTotal} thói quen ({selectedDayPercent}%)
                </Text>
              </View>
              {selectedDate === todayStr && (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Hôm nay</Text>
                </View>
              )}
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {selectedDayItems.map(({ habit, isDone }) => (
                <TouchableOpacity
                  key={habit._id}
                  activeOpacity={0.7}
                  onPress={() => handleToggleDayHabit(habit._id)}
                  style={[
                    styles.dayHabitRow,
                    isDone && { backgroundColor: '#F0FDF4' },
                  ]}
                >
                  <View
                    style={[
                      styles.dayCheckIcon,
                      isDone ? styles.dayCheckIconDone : styles.dayCheckIconMissed,
                    ]}
                  >
                    <Feather
                      name={isDone ? 'check' : 'circle'}
                      size={15}
                      color={isDone ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.dayHabitName,
                        isDone && { fontWeight: '600', color: colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                    <Text style={styles.dayHabitTime}>
                      {habit.reminderTime ? `⏰ ${habit.reminderTime}` : 'Hằng ngày'}
                    </Text>
                  </View>
                  <View style={styles.dayActionTag}>
                    <Text style={[styles.dayActionText, { color: isDone ? colors.success : colors.primary }]}>
                      {isDone ? 'Đã xong' : 'Bấm để ghi nhận'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // ===================== GIAO DIỆN MỤC 2: THỐNG KÊ MỞ RỘNG (1, 2, 3, 5, 7) =====================
  const statsSection = (
    <View style={styles.sectionWrapper}>
      {/* Bộ chọn kỳ thống kê */}
      <SegmentedControl
        tabs={['Tuần này', 'Tháng này', '3 tháng']}
        selectedIndex={statsPeriod}
        onChange={setStatsPeriod}
      />

      {/* MỤC 2: THẺ ĐIỂM SỐ KỶ LUẬT & CẤP BẬC (DISCIPLINE SCORE & RANK) */}
      <View style={[styles.bigStatCard, { borderColor: disciplineMetrics.rank.color }]}>
        <View style={styles.statTopBadgeRow}>
          <Text style={styles.bigStatLabel}>Chỉ số Kỷ luật & Phong độ</Text>
          <View style={[styles.rankBadge, { backgroundColor: disciplineMetrics.rank.badgeBg }]}>
            <Text style={styles.rankBadgeIcon}>{disciplineMetrics.rank.badge}</Text>
            <Text style={[styles.rankBadgeText, { color: disciplineMetrics.rank.color }]}>
              {disciplineMetrics.rank.title}
            </Text>
          </View>
        </View>

        <View style={styles.scoreRowContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: disciplineMetrics.rank.color }]}>
              {disciplineMetrics.score}
            </Text>
            <Text style={styles.scoreMax}>/ 100 điểm</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.scoreDescText}>{disciplineMetrics.rank.desc}</Text>
            <View style={styles.pillarBarsContainer}>
              <View style={styles.pillarItem}>
                <Text style={styles.pillarLabel}>Kiên định</Text>
                <View style={styles.pillarTrack}>
                  <View style={[styles.pillarFill, { width: `${disciplineMetrics.consistency}%`, backgroundColor: '#10B981' }]} />
                </View>
                <Text style={styles.pillarVal}>{disciplineMetrics.consistency}%</Text>
              </View>
              <View style={styles.pillarItem}>
                <Text style={styles.pillarLabel}>Bao phủ</Text>
                <View style={styles.pillarTrack}>
                  <View style={[styles.pillarFill, { width: `${disciplineMetrics.completeness}%`, backgroundColor: '#7C5CFC' }]} />
                </View>
                <Text style={styles.pillarVal}>{disciplineMetrics.completeness}%</Text>
              </View>
              <View style={styles.pillarItem}>
                <Text style={styles.pillarLabel}>Tích cực</Text>
                <View style={styles.pillarTrack}>
                  <View style={[styles.pillarFill, { width: `${disciplineMetrics.effort}%`, backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.pillarVal}>{disciplineMetrics.effort}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nút hành động MỤC 7: Chia sẻ thành tích Infographic */}
        <TouchableOpacity
          style={styles.openShareBtn}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={15} color="#FFFFFF" />
          <Text style={styles.openShareBtnText}>Tấm thiệp Thành tích Kỷ luật (Chia sẻ)</Text>
          <Feather name="arrow-up-right" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* MỤC 1: BẢN ĐỒ NHIỆT KỶ LUẬT (ACTIVITY HEATMAP) */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.chartTitle}>Bản đồ nhiệt Kỷ luật (35 ngày gần đây)</Text>
            <Text style={styles.chartSubtitle}>
              Màu càng đậm biểu thị số lượng thói quen hoàn thành càng nhiều
            </Text>
          </View>
        </View>

        {/* Lưới các ô vuông nhiệt */}
        <View style={styles.heatmapGrid}>
          {heatmapCells.map((cell, idx) => {
            const isSelected = selectedHeatmapDay?.date === cell.date;
            let bgColor = '#F1F5F9';
            let textColor: string = colors.textSecondary;

            if (cell.level === 1) {
              bgColor = '#DCFCE7';
              textColor = '#166534';
            } else if (cell.level === 2) {
              bgColor = '#86EFAC';
              textColor = '#14532D';
            } else if (cell.level === 3) {
              bgColor = '#22C55E';
              textColor = '#FFFFFF';
            } else if (cell.level === 4) {
              bgColor = '#15803D';
              textColor = '#FFFFFF';
            }

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setSelectedHeatmapDay(cell)}
                style={[
                  styles.heatmapBox,
                  { backgroundColor: bgColor },
                  isSelected && styles.heatmapBoxSelected,
                ]}
              >
                <Text style={[styles.heatmapDayText, { color: textColor }]}>
                  {cell.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chú thích mức độ Heatmap */}
        <View style={styles.heatmapLegendRow}>
          <Text style={styles.heatmapLegendLabel}>Ít</Text>
          <View style={[styles.heatmapLegendBox, { backgroundColor: '#F1F5F9' }]} />
          <View style={[styles.heatmapLegendBox, { backgroundColor: '#DCFCE7' }]} />
          <View style={[styles.heatmapLegendBox, { backgroundColor: '#86EFAC' }]} />
          <View style={[styles.heatmapLegendBox, { backgroundColor: '#22C55E' }]} />
          <View style={[styles.heatmapLegendBox, { backgroundColor: '#15803D' }]} />
          <Text style={styles.heatmapLegendLabel}>Nhiều</Text>
        </View>

        {/* Thông tin chi tiết khi chạm vào ô Heatmap */}
        {selectedHeatmapDay && (
          <View style={styles.heatmapTooltipBox}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={styles.heatmapTooltipText}>
              {getVietnameseDateText(selectedHeatmapDay.date)}:{' '}
              <Text style={{ fontWeight: '700', color: colors.primaryDark }}>
                {selectedHeatmapDay.done}/{selectedHeatmapDay.total} thói quen ({selectedHeatmapDay.pct}%)
              </Text>
            </Text>
          </View>
        )}
      </View>

      {/* Biểu đồ tiến độ theo kỳ */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.chartTitle}>{periodStats.chartTitle}</Text>
          <TouchableOpacity
            style={styles.exportReportBtn}
            onPress={() => setShowReportModal(true)}
            activeOpacity={0.8}
          >
            <Feather name="file-text" size={14} color={colors.primary} />
            <Text style={styles.exportReportText}>Báo cáo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartBarsContainer}>
          {periodStats.chartBars.map((item, idx) => (
            <View key={idx} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.max(6, item.value)}%`,
                      backgroundColor: item.value >= 80 ? colors.success : item.value >= 50 ? colors.primary : '#FCA5A5',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barPercent}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Thẻ Thói quen Tốt nhất & Cần cố gắng */}
      <View style={styles.bestWorstRow}>
        <View style={[styles.bestWorstCard, { borderColor: '#86EFAC' }]}>
          <View style={[styles.bwIcon, { backgroundColor: colors.successLight }]}>
            <Feather name="thumbs-up" size={18} color={colors.success} />
          </View>
          <Text style={styles.bwTitle}>Tốt nhất</Text>
          <Text style={styles.bwHabitName} numberOfLines={2}>
            {periodStats.bestHabit.name}
          </Text>
          <Text style={styles.bwRate}>{periodStats.bestHabit.rate}% hoàn thành</Text>
        </View>

        <View style={[styles.bestWorstCard, { borderColor: '#FCA5A5' }]}>
          <View style={[styles.bwIcon, { backgroundColor: colors.missedLight }]}>
            <Feather name="alert-triangle" size={18} color="#EF4444" />
          </View>
          <Text style={styles.bwTitle}>Cần cố gắng</Text>
          <Text style={styles.bwHabitName} numberOfLines={2}>
            {periodStats.worstHabit.name}
          </Text>
          <Text style={[styles.bwRate, { color: '#EF4444' }]}>
            {periodStats.worstHabit.rate}% hoàn thành
          </Text>
        </View>
      </View>

      {/* MỤC 3: BÁNH XE CÂN BẰNG CUỘC SỐNG THEO DANH MỤC (LIFE BALANCE) */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.chartTitle}>Cân bằng cuộc sống theo Danh mục</Text>
            <Text style={styles.chartSubtitle}>
              Mức độ duy trì đồng đều giữa các khía cạnh cuộc sống
            </Text>
          </View>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceBadgeText}>Cân bằng tốt</Text>
          </View>
        </View>

        <View style={{ gap: 12, marginTop: 4 }}>
          {categoryBalance.map((cat) => (
            <View key={cat.code} style={styles.catBalanceRow}>
              <View style={[styles.catIconCircle, { backgroundColor: `${cat.color}15` }]}>
                <Feather name={cat.icon as any} size={15} color={cat.color} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.catNameText}>{cat.name}</Text>
                  <Text style={[styles.catStatusText, { color: cat.color }]}>
                    {cat.pct}% • {cat.statusText}
                  </Text>
                </View>
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      { width: `${cat.pct}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.catHabitCount}>{cat.totalHabits} thói quen</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tiện ích Khung giờ hoạt động */}
      <View style={styles.chartCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="clock" size={16} color={colors.primary} />
            <Text style={styles.chartTitle}>Phân bổ theo Khung giờ</Text>
          </View>
          <View style={styles.topSlotBadge}>
            <Text style={styles.topSlotBadgeText}>Khung giờ vàng</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {slotBreakdown.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <View style={[styles.slotIconBox, { backgroundColor: `${slot.color}15` }]}>
                <Feather name={slot.icon as any} size={15} color={slot.color} />
              </View>
              <Text style={styles.slotNameText}>{slot.label}</Text>
              <View style={styles.slotProgressTrack}>
                <View
                  style={[
                    styles.slotProgressFill,
                    { width: `${slot.pct}%`, backgroundColor: slot.color },
                  ]}
                />
              </View>
              <Text style={styles.slotCountText}>
                {slot.count} lần <Text style={{ color: colors.textMuted }}>({slot.pct}%)</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* MỤC 5: DỰ BÁO & NHẬN DIỆN QUY LUẬT THÓI QUEN BẰNG AI */}
      <View style={styles.aiInsightCard}>
        <View style={styles.aiInsightHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="cpu" size={20} color={colors.primaryDark} />
            <Text style={styles.aiInsightTitle}>Dự báo & Quy luật Kỷ luật (AI Forecast)</Text>
          </View>
          <TouchableOpacity
            style={styles.geminiApiBtn}
            onPress={() => setShowGeminiGuideModal(true)}
            activeOpacity={0.8}
          >
            <Feather name="key" size={12} color="#FFFFFF" />
            <Text style={styles.geminiApiBtnText}>Gemini API</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiForecastBoxesRow}>
          <View style={styles.aiForecastBox}>
            <Text style={styles.aiForecastBoxLabel}>NGÀY NĂNG SUẤT ĐỈNH CAO</Text>
            <Text style={styles.aiForecastBoxValue}>{aiPredictiveAnalysis.peakDay}</Text>
            <Text style={styles.aiForecastBoxSub}>{aiPredictiveAnalysis.peakDayPct}% thói quen hoàn thành</Text>
          </View>

          <View style={styles.aiForecastBox}>
            <Text style={styles.aiForecastBoxLabel}>NGÀY CẦN CHÚ Ý LỜI NHẮC</Text>
            <Text style={[styles.aiForecastBoxValue, { color: '#EF4444' }]}>{aiPredictiveAnalysis.vulnerableDay}</Text>
            <Text style={styles.aiForecastBoxSub}>Dễ bị gián đoạn vào cuối tuần</Text>
          </View>
        </View>

        <Text style={styles.aiInsightBody}>
          🤖 <Text style={{ fontWeight: '700' }}>Dự báo mục tiêu:</Text> Với tốc độ duy trì hiện tại, bạn chỉ cần kiên trì thêm{' '}
          <Text style={{ fontWeight: '700', color: colors.primaryDark }}>{aiPredictiveAnalysis.daysRemaining} ngày nữa</Text>{' '}
          để mở khóa thành tích <Text style={{ fontWeight: '700' }}>"{aiPredictiveAnalysis.nextUnlockGoal}"</Text>! Hãy duy trì nhắc nhở thói quen buổi sáng để giữ nhịp độ ổn định.
        </Text>
      </View>

      {/* MODAL MỤC 7: TẤM THIỆP THÀNH TÍCH CHIA SẺ (SHAREABLE INFOGRAPHIC CARD) */}
      <BottomSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Tấm thiệp Kỷ luật của bạn"
      >
        <View style={{ gap: 14, paddingVertical: 8 }}>
          {/* Card thiệp thiết kế đẹp mắt */}
          <View style={styles.shareCardContainer}>
            <View style={styles.shareCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.shareCardBrand}>Smart Habit Tracker</Text>
              </View>
              <Text style={styles.shareCardDate}>{getVietnameseDateText(todayStr)}</Text>
            </View>

            <View style={styles.shareCardUserRow}>
              <View style={styles.shareAvatar}>
                <Text style={styles.shareAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.shareUserName}>{displayName}</Text>
                <View style={styles.shareRankBadge}>
                  <Text style={styles.shareRankText}>
                    {disciplineMetrics.rank.badge} {disciplineMetrics.rank.title}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.shareStatsGrid}>
              <View style={styles.shareStatBox}>
                <Text style={styles.shareStatNum}>{disciplineMetrics.score}</Text>
                <Text style={styles.shareStatLbl}>Điểm Kỷ luật</Text>
              </View>
              <View style={styles.shareStatBox}>
                <Text style={styles.shareStatNum}>{periodStats.completionRate}%</Text>
                <Text style={styles.shareStatLbl}>Tỉ lệ duy trì</Text>
              </View>
              <View style={styles.shareStatBox}>
                <Text style={styles.shareStatNum}>🔥 {stats?.longestStreak ?? 12}</Text>
                <Text style={styles.shareStatLbl}>Streak kỷ lục</Text>
              </View>
            </View>

            <View style={styles.shareHighlightBox}>
              <Text style={styles.shareHighlightTitle}>Thói quen dẫn đầu kỳ:</Text>
              <Text style={styles.shareHighlightHabit}>
                ✨ {periodStats.bestHabit.name} ({periodStats.bestHabit.rate}%)
              </Text>
            </View>

            <Text style={styles.shareQuote}>
              "Kỷ luật là chiếc cầu nối vững chắc nhất giữa mục tiêu và thành tựu."
            </Text>
          </View>

          <PrimaryButton
            title="Sao chép văn bản thành tích 📋"
            onPress={() => {
              Alert.alert(
                'Đã sao chép! 🎉',
                `Đã sao chép báo cáo thành tích của ${displayName}: Điểm kỷ luật ${disciplineMetrics.score}/100, Streak ${stats?.longestStreak ?? 12} ngày!`
              );
              setShowShareModal(false);
            }}
          />
        </View>
      </BottomSheet>

      {/* MODAL MỤC 5: HƯỚNG DẪN CẤU HÌNH GEMINI API KEY */}
      <BottomSheet
        visible={showGeminiGuideModal}
        onClose={() => setShowGeminiGuideModal(false)}
        title="Hướng dẫn cấu hình Gemini AI API"
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12, paddingVertical: 8 }}>
            <View style={styles.geminiGuideStep}>
              <Text style={styles.stepNum}>1</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Lấy Google Gemini API Key miễn phí</Text>
                <Text style={styles.stepBody}>
                  Truy cập Google AI Studio: https://aistudio.google.com $\to$ Đăng nhập Google $\to$ Nhấn "Get API key" $\to$ Tạo khóa mới.
                </Text>
              </View>
            </View>

            <View style={styles.geminiGuideStep}>
              <Text style={styles.stepNum}>2</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Cấu hình biến môi trường</Text>
                <Text style={styles.stepBody}>
                  Mở file cấu hình backend `application.properties` hoặc `.env` frontend:
                  {'\n'}
                  <Text style={styles.codeSnippet}>GEMINI_API_KEY=AIzaSy...your_key_here</Text>
                </Text>
              </View>
            </View>

            <View style={styles.geminiGuideStep}>
              <Text style={styles.stepNum}>3</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Tính năng AI tự động kích hoạt</Text>
                <Text style={styles.stepBody}>
                  Khi đã có Key, ứng dụng sẽ gửi chuỗi lịch sử check-in sang Gemini để sinh lời khuyên tâm lý cá nhân hóa, dự báo rủi ro bỏ lỡ và đề xuất khung giờ tối ưu theo thời gian thực!
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Đã hiểu hướng dẫn"
              onPress={() => setShowGeminiGuideModal(false)}
              style={{ marginTop: 6 }}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      {/* BottomSheet Báo cáo năng suất */}
      <BottomSheet
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`Báo cáo năng suất • ${periodStats.periodTitle}`}
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <View style={styles.reportSummaryBox}>
            <Text style={styles.reportSummaryTitle}>TỔNG KẾT NĂNG SUẤT</Text>
            <Text style={styles.reportSummaryHighlight}>
              {periodStats.completionRate}% Tỉ lệ hoàn thành
            </Text>
            <Text style={styles.reportSummaryDetail}>
              • Đã check-in: {periodStats.totalCompleted} lần{'\n'}
              • Điểm Kỷ luật: {disciplineMetrics.score}/100 ({disciplineMetrics.rank.title}){'\n'}
              • Thói quen xuất sắc: {periodStats.bestHabit.name} ({periodStats.bestHabit.rate}%){'\n'}
              • Cần lưu ý: {periodStats.worstHabit.name} ({periodStats.worstHabit.rate}%){'\n'}
              • Chuỗi Streak kỷ lục: {stats?.longestStreak ?? 12} ngày liên tục
            </Text>
          </View>

          <PrimaryButton
            title="Sao chép tóm tắt báo cáo"
            onPress={() => {
              Alert.alert('Đã sao chép! 📋', 'Đã lưu tóm tắt báo cáo năng suất vào bộ nhớ tạm.');
              setShowReportModal(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );

  // Cờ cấu hình: Ẩn tab thống kê đối với người dùng thông thường, sẵn sàng tái sử dụng khi phát triển trang Admin
  const SHOW_ADMIN_STATS = false;

  return (
    <ScreenContainer>
      <AppHeader title="Lịch theo dõi 📅" />

      {SHOW_ADMIN_STATS && (
        <SegmentedControl
          tabs={['Lịch', 'Thống kê']}
          selectedIndex={activeTab}
          onChange={setActiveTab}
        />
      )}

      {(!SHOW_ADMIN_STATS || activeTab === 0) ? calendarSection : statsSection}
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
  jumpTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.chip,
  },
  jumpTodayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
  dayDetailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dayDetailTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayDetailSubtext: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  todayPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  dayHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dayCheckIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayCheckIconDone: {
    backgroundColor: colors.success,
  },
  dayCheckIconMissed: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  dayHabitName: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  dayHabitTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayActionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    backgroundColor: '#F8F7FF',
  },
  dayActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Thống kê & Điểm số (Mục 2)
  bigStatCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  statTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bigStatLabel: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  rankBadgeIcon: {
    fontSize: 13,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F8F7FF',
    borderWidth: 3,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scoreDescText: {
    fontSize: fontSizes.caption + 1,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 10,
  },
  pillarBarsContainer: {
    gap: 6,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarLabel: {
    width: 60,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pillarFill: {
    height: '100%',
    borderRadius: 3,
  },
  pillarVal: {
    width: 32,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  openShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    marginTop: 4,
  },
  openShareBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // MỤC 1: Heatmap Styles
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  heatmapBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapBoxSelected: {
    borderWidth: 2,
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.1 }],
  },
  heatmapDayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  heatmapLegendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  heatmapLegendLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  heatmapTooltipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    marginTop: 8,
  },
  heatmapTooltipText: {
    fontSize: fontSizes.caption,
    color: colors.textPrimary,
  },
  exportReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
    backgroundColor: colors.primaryLight,
  },
  exportReportText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 24,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 48,
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: colors.borderLight,
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
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
  // MỤC 3: Cân bằng Danh mục
  balanceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  catBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catNameText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catTrack: {
    height: 7,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 4,
  },
  catHabitCount: {
    fontSize: 11,
    color: colors.textMuted,
    width: 68,
    textAlign: 'right',
  },
  topSlotBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  topSlotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNameText: {
    width: 80,
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  slotProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  slotCountText: {
    width: 85,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // MỤC 5: AI Insights & Forecast
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiInsightTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  geminiApiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  geminiApiBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiForecastBoxesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  aiForecastBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DCFC',
  },
  aiForecastBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  aiForecastBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  aiForecastBoxSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  aiInsightBody: {
    fontSize: fontSizes.caption + 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // MỤC 7: Tấm thiệp chia sẻ Infographic
  shareCardContainer: {
    backgroundColor: '#1E1B2E',
    borderRadius: radii.card,
    padding: 22,
    borderWidth: 1,
    borderColor: '#383452',
  },
  shareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#342F4B',
    paddingBottom: 10,
  },
  shareCardBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareCardDate: {
    fontSize: 11,
    color: '#A5A2BD',
  },
  shareCardUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  shareAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareRankBadge: {
    backgroundColor: '#2D2845',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  shareRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  shareStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shareStatBox: {
    flex: 1,
    backgroundColor: '#28243D',
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareStatNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shareStatLbl: {
    fontSize: 10,
    color: '#A5A2BD',
    marginTop: 2,
  },
  shareHighlightBox: {
    backgroundColor: '#28243D',
    borderRadius: radii.sm,
    padding: 10,
    marginBottom: 14,
  },
  shareHighlightTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5A2BD',
    textTransform: 'uppercase',
  },
  shareHighlightHabit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#86EFAC',
    marginTop: 2,
  },
  shareQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#A5A2BD',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal Gemini Guide
  geminiGuideStep: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8F7FF',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  stepTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepBody: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  codeSnippet: {
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  reportSummaryBox: {
    backgroundColor: '#F8F7FF',
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportSummaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reportSummaryHighlight: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  reportSummaryDetail: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
