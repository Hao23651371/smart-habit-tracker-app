import { HabitLog } from '../types';
import { formatDate, getPastDates } from '../utils/date';

/**
 * Tạo mock logs 30 ngày gần nhất với tỉ lệ hoàn thành ~78%
 * Hôm nay đã xong 3/5 thói quen (Uống nước ấm, Đi bộ nhanh, Hít thở sâu).
 * 2 thói quen tối (Đọc sách, Thiền buông thư) đang chờ làm.
 */
function generateMockLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const todayStr = formatDate(new Date());
  const past30Days = getPastDates(30, new Date());

  // Danh sách ID 5 thói quen daily chính
  const dailyHabitIds = ['h_water', 'h_walk', 'h_breathe', 'h_book', 'h_meditate'];

  // 1. Tạo log cho các ngày trong quá khứ (29 ngày trước đến hôm qua)
  for (let i = 0; i < past30Days.length - 1; i++) {
    const dateStr = past30Days[i];
    const dayIndex = i; // 0 đến 28

    for (const habitId of dailyHabitIds) {
      // Đảm bảo 12 ngày gần nhất (từ index 17 đến 28) liên tục hoàn thành để giữ chuỗi streak 12 ngày
      let isDone = true;

      if (dayIndex < 17) {
        // Các ngày cũ hơn: phân bổ một vài ngày skipped để tỉ lệ đạt ~78%
        const pseudoRandom = (dayIndex * 7 + habitId.length * 3) % 10;
        isDone = pseudoRandom > 2; // ~70-80% done
      } else {
        // 12 ngày gần đây: đa số đều done để tạo streak
        const streakVariance = (dayIndex + habitId.length) % 15;
        isDone = streakVariance !== 0; // Hầu hết đều done
      }

      logs.push({
        _id: `log_${dateStr}_${habitId}`,
        id: `log_${dateStr}_${habitId}`,
        userId: 'usr_an_123456',
        habitId,
        date: dateStr,
        status: isDone ? 'done' : 'skipped',
        value: 1,
        currentValue: 1,
        completedAt: isDone ? `${dateStr}T12:00:00Z` : undefined,
        loggedAt: `${dateStr}T12:00:00Z`,
      });
    }

    // Thói quen tập thể dục (h_workout) chỉ vào Thứ 2 (1), Thứ 4 (3), Thứ 6 (5)
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      logs.push({
        _id: `log_${dateStr}_h_workout`,
        id: `log_${dateStr}_h_workout`,
        userId: 'usr_an_123456',
        habitId: 'h_workout',
        date: dateStr,
        status: 'done',
        value: 30,
        currentValue: 30,
        completedAt: `${dateStr}T17:35:00Z`,
        loggedAt: `${dateStr}T17:35:00Z`,
      });
    }
  }

  // 2. Tạo log cho HÔM NAY (chính xác 3/5 đã xong)
  // Xong 3 cái buổi sáng:
  logs.push({
    _id: `log_${todayStr}_h_water`,
    id: `log_${todayStr}_h_water`,
    userId: 'usr_an_123456',
    habitId: 'h_water',
    date: todayStr,
    status: 'done',
    value: 1,
    currentValue: 1,
    note: 'Đã uống 500ml nước ấm chanh mật ong',
    completedAt: `${todayStr}T07:05:00Z`,
    loggedAt: `${todayStr}T07:05:00Z`,
  });

  logs.push({
    _id: `log_${todayStr}_h_walk`,
    id: `log_${todayStr}_h_walk`,
    userId: 'usr_an_123456',
    habitId: 'h_walk',
    date: todayStr,
    status: 'done',
    value: 15,
    currentValue: 15,
    note: 'Đi bộ quanh công viên khu phố',
    completedAt: `${todayStr}T07:45:00Z`,
    loggedAt: `${todayStr}T07:45:00Z`,
  });

  logs.push({
    _id: `log_${todayStr}_h_breathe`,
    id: `log_${todayStr}_h_breathe`,
    userId: 'usr_an_123456',
    habitId: 'h_breathe',
    date: todayStr,
    status: 'done',
    value: 3,
    currentValue: 3,
    note: 'Hít thở sâu 3 phút giải toả căng thẳng',
    completedAt: `${todayStr}T09:05:00Z`,
    loggedAt: `${todayStr}T09:05:00Z`,
  });

  return logs;
}

export const mockHabitLogs: HabitLog[] = generateMockLogs();
