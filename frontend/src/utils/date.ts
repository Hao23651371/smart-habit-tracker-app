import { Habit, HabitLog, HabitStats } from '../types';
import { computeHabitStats } from './habitStats';

export { computeHabitStats } from './habitStats';

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
 * Sử dụng module thống kê duy nhất computeHabitStats để toàn app đồng nhất 100%.
 */
export function calculateStats(
  habits: Habit[] = [],
  logs: HabitLog[] = [],
  today: string = formatDate()
): HabitStats {
  return computeHabitStats(habits, logs, new Date(today));
}
