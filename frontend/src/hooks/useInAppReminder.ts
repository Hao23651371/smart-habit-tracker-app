import { useState, useEffect, useRef, useCallback } from 'react';
import { Habit } from '../types';
import { useHabits } from './useHabits';
import { useLogs } from './useLogs';
import { formatDate } from '../utils/date';
import { ReminderType } from '../utils/reminderCopy';
import { getConfirmedHabitIds, markHabitConfirmed } from '../utils/notifications';
import {
  REMINDER_LEAD_STEPS,
  IN_APP_BANNER_DURATION_MS,
  START_BANNER_DURATION_MS,
  IN_APP_CHECK_INTERVAL_MS,
} from '../constants/reminder';

export interface ActiveReminderInfo {
  habit: Habit;
  type: ReminderType;
  minutesLeft?: number;
}

/** Tính số phút chênh lệch giữa giờ hẹn và giờ hiện tại */
function getDiffMinutes(reminderTime: string, now: Date): number {
  const [h, m] = (reminderTime || '08:00').split(':').map((v) => parseInt(v, 10) || 0);
  const target = h * 60 + m;
  const current = now.getHours() * 60 + now.getMinutes();
  return target - current;
}

/** Hook quản lý kiểm tra giờ và kích hoạt banner nhắc nhở trong ứng dụng */
export function useInAppReminder() {
  const { habits } = useHabits();
  const { logs } = useLogs();
  const [activeReminder, setActiveReminder] = useState<ActiveReminderInfo | null>(null);
  const shownKeysRef = useRef<Set<string>>(new Set());
  const confirmedIdsRef = useRef<Set<string>>(new Set());
  const currentDateRef = useRef<string>(formatDate());

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  const confirmReminder = useCallback(async (habitId: string) => {
    const today = currentDateRef.current;
    confirmedIdsRef.current.add(habitId);
    await markHabitConfirmed(habitId, today);
    setActiveReminder(null);
  }, []);

  const checkHabitCandidate = (
    h: Habit,
    diff: number,
    todayStr: string,
    doneIds: Set<string>
  ): ActiveReminderInfo | null => {
    if (doneIds.has(h._id)) return null;
    const startKey = `${h._id}_start_${todayStr}`;
    if (diff === 0 && !shownKeysRef.current.has(startKey)) {
      shownKeysRef.current.add(startKey);
      return { habit: h, type: 'start' };
    }
    if (h.goalType === 'duration' && h.targetValue > 0) {
      const durEndKey = `${h._id}_durend_${todayStr}`;
      const elapsed = -diff;
      if (elapsed >= h.targetValue && elapsed <= h.targetValue + 3 && !shownKeysRef.current.has(durEndKey)) {
        shownKeysRef.current.add(durEndKey);
        return { habit: h, type: 'duration_end' };
      }
    }
    if (confirmedIdsRef.current.has(h._id)) return null;
    for (const lead of REMINDER_LEAD_STEPS) {
      const preKey = `${h._id}_pre_${lead}_${todayStr}`;
      if (diff === lead && !shownKeysRef.current.has(preKey)) {
        shownKeysRef.current.add(preKey);
        return { habit: h, type: 'pre', minutesLeft: lead };
      }
    }
    return null;
  };

  useEffect(() => {
    const today = formatDate();
    getConfirmedHabitIds(today).then((ids) => {
      confirmedIdsRef.current = new Set(ids);
    });
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = formatDate(now);
      if (todayStr !== currentDateRef.current) {
        currentDateRef.current = todayStr;
        shownKeysRef.current.clear();
        confirmedIdsRef.current.clear();
      }
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const doneIds = new Set(logs.filter((l) => l.date === todayStr && l.status === 'done').map((l) => l.habitId));
      for (const h of habits) {
        if (h.status !== 'active' || !h.reminderEnabled) continue;
        const isScheduled = h.frequency === 'daily' || Boolean(h.daysOfWeek?.includes(dayOfWeek));
        if (!isScheduled) continue;
        const diff = getDiffMinutes(h.reminderTime, now);
        const candidate = checkHabitCandidate(h, diff, todayStr, doneIds);
        if (candidate) {
          setActiveReminder(candidate);
          break;
        }
      }
    };
    checkReminders();
    const timer = setInterval(checkReminders, IN_APP_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [habits, logs]);

  useEffect(() => {
    if (!activeReminder) return;
    const duration = activeReminder.type === 'start' ? START_BANNER_DURATION_MS : IN_APP_BANNER_DURATION_MS;
    const autoDismiss = setTimeout(dismissReminder, duration);
    return () => clearTimeout(autoDismiss);
  }, [activeReminder, dismissReminder]);

  return { activeReminder, dismissReminder, confirmReminder };
}
