import { Habit, HabitLog } from '../types';
import { formatDate, getCurrentWeekDays, getPastDates } from './date';

export interface CalculatedStats {
  totalHabits: number;
  totalCompleted: number;
  totalLogs: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // Tỉ lệ hoàn thành 30 ngày gần nhất (~78%)
  weeklyRate: number; // Tỉ lệ hoàn thành tuần này (~78%)
  perfectDaysCount: number;
  todayDoneCount: number;
  todayTotalCount: number;
  todayProgressPercent: number;
}

/**
 * FILE DUY NHẤT TÍNH TOÁN THỐNG KÊ TOÀN ỨNG DỤNG TỪ DỮ LIỆU LOGS THỰC TẾ:
 * - Streak hiện tại (currentStreak)
 * - Streak kỷ lục (longestStreak)
 * - Tỉ lệ hoàn thành tuần này (weeklyRate)
 * - Tỉ lệ hoàn thành 30 ngày (completionRate)
 * - Tổng số lượt hoàn thành (totalCompleted)
 * - Số ngày hoàn hảo (perfectDaysCount)
 * - Tiến độ hôm nay (todayDoneCount, todayTotalCount, todayProgressPercent)
 *
 * Mọi màn hình (Home, Lịch, Thống kê, AI, Profile, Thành tích) đều dùng từ đây,
 * không hard-code số trong giao diện.
 */
export function computeHabitStats(
  habits: Habit[] = [],
  logs: HabitLog[] = [],
  referenceDate: Date = new Date()
): CalculatedStats {
  const todayStr = formatDate(referenceDate);
  const activeHabits = habits.filter((h) => h.status === 'active');
  const nowDayOfWeek = referenceDate.getDay() === 0 ? 7 : referenceDate.getDay();

  // 1. Lọc thói quen CẦN LÀM hôm nay
  const todayHabits = activeHabits.filter((h) => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly' && h.daysOfWeek) {
      return h.daysOfWeek.includes(nowDayOfWeek);
    }
    return false;
  });

  const todayHabitIdSet = new Set(todayHabits.map((h) => h._id));
  const todayDoneCount = logs.filter(
    (l) => l.date === todayStr && l.status === 'done' && todayHabitIdSet.has(l.habitId)
  ).length;
  const todayTotalCount = todayHabits.length;
  const todayProgressPercent =
    todayTotalCount > 0 ? Math.round((todayDoneCount / todayTotalCount) * 100) : 0;

  // 2. Tính Streak hiện tại (chuỗi ngày liên tiếp có ít nhất 1 thói quen done)
  const doneDateSet = new Set(logs.filter((l) => l.status === 'done').map((l) => l.date));
  let currentStreak = 0;
  const cursor = new Date(referenceDate);
  if (!doneDateSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (doneDateSet.has(formatDate(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // 3. Tính Streak kỷ lục trong 30 ngày
  const past30 = getPastDates(30, referenceDate);
  let longestStreak = 0;
  let tempStreak = 0;
  for (const d of past30) {
    if (doneDateSet.has(d)) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // 4. Tổng số lần hoàn thành & Tỉ lệ hoàn thành 30 ngày
  const totalCompleted = logs.filter((l) => l.status === 'done').length;
  const totalLogs = logs.length;
  const completionRate = totalLogs > 0 ? Math.round((totalCompleted / totalLogs) * 100) : 0;

  // 5. Tỉ lệ tuần này (tính từ Thứ 2 đến ngày hiện tại)
  const currentWeekDays = getCurrentWeekDays(referenceDate);
  const weekSet = new Set(currentWeekDays);
  const weekLogs = logs.filter((l) => weekSet.has(l.date) && l.date <= todayStr);
  const weekDone = weekLogs.filter((l) => l.status === 'done').length;
  const weeklyRate = weekLogs.length > 0 ? Math.round((weekDone / weekLogs.length) * 100) : 0;

  // 6. Số ngày hoàn hảo (ngày hoàn thành 100% thói quen được giao)
  const logsByDate = new Map<string, { total: number; done: number }>();
  for (const l of logs) {
    const cur = logsByDate.get(l.date) || { total: 0, done: 0 };
    cur.total++;
    if (l.status === 'done') cur.done++;
    logsByDate.set(l.date, cur);
  }
  let perfectDaysCount = 0;
  for (const [, counts] of logsByDate.entries()) {
    if (counts.total > 0 && counts.done === counts.total) {
      perfectDaysCount++;
    }
  }

  return {
    totalHabits: activeHabits.length,
    totalCompleted,
    totalLogs,
    currentStreak,
    longestStreak,
    completionRate,
    weeklyRate,
    perfectDaysCount,
    todayDoneCount,
    todayTotalCount,
    todayProgressPercent,
  };
}
