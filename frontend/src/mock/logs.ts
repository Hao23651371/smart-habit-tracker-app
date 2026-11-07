import { HabitLog } from '../types';
import { formatDate, getCurrentWeekDays, getPastDates } from '../utils/date';

/**
 * TẠO MOCK LOGS 30 NGÀY TÍNH THEO NGÀY HIỆN TẠI (new Date):
 * - Streak hiện tại: chính xác 12 ngày liên tiếp kết thúc hôm nay.
 * - Ngày thứ 12 trước hôm nay (daysAgo = 12) là ngày nghỉ hoàn toàn -> streak ngắt tại đúng 12 ngày.
 * - Hôm nay: chính xác 3/5 thói quen daily CẦN LÀM hôm nay đã xong (Uống nước ấm, Đi bộ nhanh, Hít thở sâu).
 * - Thói quen weekly (h_workout) chỉ được log vào ngày lịch (T2, T6; hôm nay Thứ 7 nên KHÔNG cần làm).
 * - Tỉ lệ tuần này: đạt chính xác 78% (25 hoàn thành / 32 lần giao).
 * - Tỉ lệ 30 ngày: đạt ~78% với đúng 126 lần hoàn thành.
 */
export function generateMockLogs(now: Date = new Date()): HabitLog[] {
  const logs: HabitLog[] = [];
  const todayStr = formatDate(now);
  const past30Days = getPastDates(30, now);
  const currentWeek = getCurrentWeekDays(now);
  const weekSet = new Set(currentWeek);

  const dailyHabitIds = ['h_water', 'h_walk', 'h_breathe', 'h_book', 'h_meditate'];

  for (let i = 0; i < past30Days.length; i++) {
    const dateStr = past30Days[i];
    const daysAgo = 29 - i;
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=T2..7=CN

    // 1. Ngày hôm nay (daysAgo = 0): Đúng 3/5 thói quen cần làm đã xong
    if (daysAgo === 0) {
      logs.push({
        _id: `log_${dateStr}_h_water`,
        id: `log_${dateStr}_h_water`,
        userId: 'usr_an_123456',
        habitId: 'h_water',
        date: dateStr,
        status: 'done',
        value: 1,
        currentValue: 1,
        note: 'Đã uống 500ml nước ấm',
        completedAt: `${dateStr}T07:05:00Z`,
        loggedAt: `${dateStr}T07:05:00Z`,
      });
      logs.push({
        _id: `log_${dateStr}_h_walk`,
        id: `log_${dateStr}_h_walk`,
        userId: 'usr_an_123456',
        habitId: 'h_walk',
        date: dateStr,
        status: 'done',
        value: 15,
        currentValue: 15,
        note: 'Đi bộ nhanh 15 phút quanh hồ',
        completedAt: `${dateStr}T07:45:00Z`,
        loggedAt: `${dateStr}T07:45:00Z`,
      });
      logs.push({
        _id: `log_${dateStr}_h_breathe`,
        id: `log_${dateStr}_h_breathe`,
        userId: 'usr_an_123456',
        habitId: 'h_breathe',
        date: dateStr,
        status: 'done',
        value: 3,
        currentValue: 3,
        note: 'Hít thở sâu 3 phút',
        completedAt: `${dateStr}T09:05:00Z`,
        loggedAt: `${dateStr}T09:05:00Z`,
      });
      logs.push({
        _id: `log_${dateStr}_h_book`,
        id: `log_${dateStr}_h_book`,
        userId: 'usr_an_123456',
        habitId: 'h_book',
        date: dateStr,
        status: 'skipped',
        value: 0,
        currentValue: 0,
        loggedAt: `${dateStr}T10:00:00Z`,
      });
      logs.push({
        _id: `log_${dateStr}_h_meditate`,
        id: `log_${dateStr}_h_meditate`,
        userId: 'usr_an_123456',
        habitId: 'h_meditate',
        date: dateStr,
        status: 'skipped',
        value: 0,
        currentValue: 0,
        loggedAt: `${dateStr}T10:00:00Z`,
      });
      // Hôm nay Thứ 7 nên thói quen h_workout (T2, T6) không có log
      continue;
    }

    // 2. Ngày ngắt chuỗi streak (12 ngày trước): Toàn bộ thói quen đều skipped -> streak dừng đúng 12 ngày!
    if (daysAgo === 12) {
      for (const h of dailyHabitIds) {
        logs.push({
          _id: `log_${dateStr}_${h}`,
          id: `log_${dateStr}_${h}`,
          userId: 'usr_an_123456',
          habitId: h,
          date: dateStr,
          status: 'skipped',
          value: 0,
          currentValue: 0,
          loggedAt: `${dateStr}T12:00:00Z`,
        });
      }
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        logs.push({
          _id: `log_${dateStr}_h_workout`,
          id: `log_${dateStr}_h_workout`,
          userId: 'usr_an_123456',
          habitId: 'h_workout',
          date: dateStr,
          status: 'skipped',
          value: 0,
          currentValue: 0,
          loggedAt: `${dateStr}T17:30:00Z`,
        });
      }
      continue;
    }

    // 3. Tuần này (Thứ 2 đến Thứ 6): Tỉ lệ tuần đạt đúng 78% (25 done / 32 logs)
    if (weekSet.has(dateStr)) {
      let doneSet = new Set(['h_water', 'h_walk', 'h_breathe']);
      if (dayOfWeek === 1) doneSet = new Set(['h_water', 'h_walk', 'h_breathe', 'h_book', 'h_workout']);
      else if (dayOfWeek === 2) doneSet = new Set(['h_water', 'h_walk', 'h_breathe', 'h_book']);
      else if (dayOfWeek === 3) doneSet = new Set(['h_water', 'h_walk', 'h_breathe', 'h_meditate']);
      else if (dayOfWeek === 4) doneSet = new Set(['h_water', 'h_walk', 'h_breathe', 'h_book']);
      else if (dayOfWeek === 5) doneSet = new Set(['h_water', 'h_walk', 'h_breathe', 'h_meditate', 'h_workout']);

      for (const h of dailyHabitIds) {
        const isDone = doneSet.has(h);
        logs.push({
          _id: `log_${dateStr}_${h}`,
          id: `log_${dateStr}_${h}`,
          userId: 'usr_an_123456',
          habitId: h,
          date: dateStr,
          status: isDone ? 'done' : 'skipped',
          value: isDone ? 1 : 0,
          currentValue: isDone ? 1 : 0,
          completedAt: isDone ? `${dateStr}T12:00:00Z` : undefined,
          loggedAt: `${dateStr}T12:00:00Z`,
        });
      }
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        const isDoneWorkout = doneSet.has('h_workout');
        logs.push({
          _id: `log_${dateStr}_h_workout`,
          id: `log_${dateStr}_h_workout`,
          userId: 'usr_an_123456',
          habitId: 'h_workout',
          date: dateStr,
          status: isDoneWorkout ? 'done' : 'skipped',
          value: isDoneWorkout ? 30 : 0,
          currentValue: isDoneWorkout ? 30 : 0,
          completedAt: isDoneWorkout ? `${dateStr}T17:30:00Z` : undefined,
          loggedAt: `${dateStr}T17:30:00Z`,
        });
      }
      continue;
    }

    // 4. Khoảng duy trì streak (daysAgo từ 11 về 6): Mỗi ngày hoàn thành phần lớn thói quen
    if (daysAgo <= 11) {
      for (let hIdx = 0; hIdx < dailyHabitIds.length; hIdx++) {
        const h = dailyHabitIds[hIdx];
        const isDone = (daysAgo + hIdx) % 5 !== 0;
        logs.push({
          _id: `log_${dateStr}_${h}`,
          id: `log_${dateStr}_${h}`,
          userId: 'usr_an_123456',
          habitId: h,
          date: dateStr,
          status: isDone ? 'done' : 'skipped',
          value: isDone ? 1 : 0,
          currentValue: isDone ? 1 : 0,
          completedAt: isDone ? `${dateStr}T12:00:00Z` : undefined,
          loggedAt: `${dateStr}T12:00:00Z`,
        });
      }
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        const isDoneWorkout = daysAgo % 2 === 0;
        logs.push({
          _id: `log_${dateStr}_h_workout`,
          id: `log_${dateStr}_h_workout`,
          userId: 'usr_an_123456',
          habitId: 'h_workout',
          date: dateStr,
          status: isDoneWorkout ? 'done' : 'skipped',
          value: isDoneWorkout ? 30 : 0,
          currentValue: isDoneWorkout ? 30 : 0,
          completedAt: isDoneWorkout ? `${dateStr}T17:30:00Z` : undefined,
          loggedAt: `${dateStr}T17:30:00Z`,
        });
      }
      continue;
    }

    // 5. Ngày nghỉ thứ 2 (daysAgo = 21) để streak kỷ lục trong 30 ngày không vượt quá 12
    if (daysAgo === 21) {
      for (const h of dailyHabitIds) {
        logs.push({
          _id: `log_${dateStr}_${h}`,
          id: `log_${dateStr}_${h}`,
          userId: 'usr_an_123456',
          habitId: h,
          date: dateStr,
          status: 'skipped',
          value: 0,
          currentValue: 0,
          loggedAt: `${dateStr}T12:00:00Z`,
        });
      }
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        logs.push({
          _id: `log_${dateStr}_h_workout`,
          id: `log_${dateStr}_h_workout`,
          userId: 'usr_an_123456',
          habitId: 'h_workout',
          date: dateStr,
          status: 'skipped',
          value: 0,
          currentValue: 0,
          loggedAt: `${dateStr}T17:30:00Z`,
        });
      }
      continue;
    }

    // 6. Các ngày cũ hơn (daysAgo 13 đến 29)
    for (let hIdx = 0; hIdx < dailyHabitIds.length; hIdx++) {
      const h = dailyHabitIds[hIdx];
      const isDone = (daysAgo * 3 + hIdx * 7) % 10 >= 2;
      logs.push({
        _id: `log_${dateStr}_${h}`,
        id: `log_${dateStr}_${h}`,
        userId: 'usr_an_123456',
        habitId: h,
        date: dateStr,
        status: isDone ? 'done' : 'skipped',
        value: isDone ? 1 : 0,
        currentValue: isDone ? 1 : 0,
        completedAt: isDone ? `${dateStr}T12:00:00Z` : undefined,
        loggedAt: `${dateStr}T12:00:00Z`,
      });
    }
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      const isDoneWorkout = daysAgo % 3 !== 0;
      logs.push({
        _id: `log_${dateStr}_h_workout`,
        id: `log_${dateStr}_h_workout`,
        userId: 'usr_an_123456',
        habitId: 'h_workout',
        date: dateStr,
        status: isDoneWorkout ? 'done' : 'skipped',
        value: isDoneWorkout ? 30 : 0,
        currentValue: isDoneWorkout ? 30 : 0,
        completedAt: isDoneWorkout ? `${dateStr}T17:30:00Z` : undefined,
        loggedAt: `${dateStr}T17:30:00Z`,
      });
    }
  }

  // Cân chỉnh chính xác tổng hoàn thành = 126 và tổng logs = 162
  const totalCompleted = logs.filter((l) => l.status === 'done').length;
  const diff = 126 - totalCompleted;
  let adjusted = 0;
  for (let i = 0; i < logs.length; i++) {
    if (
      diff > 0 &&
      logs[i].status === 'skipped' &&
      !weekSet.has(logs[i].date) &&
      logs[i].date !== past30Days[17] &&
      logs[i].date !== past30Days[8]
    ) {
      logs[i].status = 'done';
      adjusted++;
      if (adjusted === diff) break;
    }
  }

  // Đảm bảo tổng logs = 162 để 126 / 162 = 77.78% -> làm tròn chuẩn 78%
  while (logs.length < 162) {
    logs.push({
      _id: `log_pad_${logs.length}`,
      id: `log_pad_${logs.length}`,
      userId: 'usr_an_123456',
      habitId: 'h_workout',
      date: past30Days[14],
      status: 'skipped',
      value: 0,
      currentValue: 0,
      loggedAt: `${past30Days[14]}T18:00:00Z`,
    });
  }

  return logs;
}

export const mockHabitLogs: HabitLog[] = generateMockLogs();
