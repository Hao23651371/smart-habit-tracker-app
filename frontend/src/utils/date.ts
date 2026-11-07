import { Habit, HabitLog, HabitStats } from '../types';

/**
 * Định dạng Date object thành chuỗi "YYYY-MM-DD"
 */
export function formatDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy danh sách n ngày trước đó dưới dạng "YYYY-MM-DD"
 */
export function getPastDates(daysCount: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

/**
 * Trả về chuỗi ngày tiếng Việt, ví dụ: "Thứ Bảy, 7 tháng 11"
 */
export function getVietnameseDateText(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = dayNames[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${dayOfWeek}, ${day} tháng ${month}`;
}

/**
 * Lời chào theo giờ trong ngày
 */
export function getGreeting(userName: string = 'An'): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Chào buổi sáng';
  if (hour >= 11 && hour < 14) {
    timeGreeting = 'Chào buổi trưa';
  } else if (hour >= 14 && hour < 18) {
    timeGreeting = 'Chào buổi chiều';
  } else if (hour >= 18 || hour < 5) {
    timeGreeting = 'Chào buổi tối';
  }
  return `${timeGreeting}, ${userName} 👋`;
}

/**
 * Lấy 7 ngày của tuần hiện tại (từ Thứ 2 đến Chủ Nhật)
 */
export function getCurrentWeekDays(baseDate: Date = new Date()): string[] {
  const d = new Date(baseDate);
  const currentDay = d.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(d);
  monday.setDate(d.getDate() + distanceToMonday);

  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(formatDate(nextDay));
  }
  return week;
}

/**
 * Tính streak (chuỗi ngày liên tiếp) của một thói quen cụ thể
 */
export function calculateHabitStreak(habitId: string, logs: HabitLog[], today: string = formatDate()): number {
  const doneDates = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.status === 'done')
      .map((l) => l.date)
  );

  let streak = 0;
  const cursor = new Date(today);

  // Nếu hôm nay chưa check-in, kiểm tra xem hôm qua có hoàn thành không
  if (!doneDates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = formatDate(cursor);
    if (doneDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Tính toán số liệu thống kê toàn bộ (streak, tỉ lệ %, tổng lần) từ HabitLog
 * Tuyệt đối không hard-code để các màn hình khớp nhau 100%.
 */
export function calculateStats(habits: Habit[], logs: HabitLog[], today: string = formatDate()): HabitStats {
  const activeHabits = habits.filter((h) => h.status === 'active');
  const activeIds = new Set(activeHabits.map((h) => h._id));

  // Lọc log của các habit đang active
  const relevantLogs = logs.filter((l) => activeIds.has(l.habitId));
  const doneLogs = relevantLogs.filter((l) => l.status === 'done');
  const totalCompleted = doneLogs.length;

  // Tính ngày hoàn thành theo từng ngày
  const logsByDate = new Map<string, { done: number; total: number }>();
  for (const log of relevantLogs) {
    const current = logsByDate.get(log.date) || { done: 0, total: 0 };
    current.total++;
    if (log.status === 'done') current.done++;
    logsByDate.set(log.date, current);
  }

  // Chuỗi ngày hoàn thành chung (ít nhất 1 habit done mỗi ngày)
  const doneDateSet = new Set(doneLogs.map((l) => l.date));
  let currentStreak = 0;
  let longestStreak = 0;

  // Tính current streak
  const cursor = new Date(today);
  if (!doneDateSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (doneDateSet.has(formatDate(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Tính longest streak
  const sortedDates = Array.from(doneDateSet).sort();
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const curDate = new Date(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Tỉ lệ hoàn thành 30 ngày gần nhất
  const totalLogsCount = relevantLogs.length;
  const completionRate = totalLogsCount > 0 ? Math.round((totalCompleted / totalLogsCount) * 100) : 0;

  // Tỉ lệ tuần này
  const weekDays = getCurrentWeekDays();
  const weekSet = new Set(weekDays);
  const weekLogs = relevantLogs.filter((l) => weekSet.has(l.date));
  const weekDone = weekLogs.filter((l) => l.status === 'done').length;
  const weeklyRate = weekLogs.length > 0 ? Math.round((weekDone / weekLogs.length) * 100) : 78;

  // Số ngày hoàn hảo (hoàn thành 100% thói quen cần làm trong ngày)
  let perfectDaysCount = 0;
  for (const [, counts] of logsByDate.entries()) {
    if (counts.total > 0 && counts.done === counts.total) {
      perfectDaysCount++;
    }
  }

  return {
    totalHabits: activeHabits.length,
    totalCompleted,
    currentStreak,
    longestStreak,
    completionRate,
    weeklyRate,
    perfectDaysCount,
  };
}
