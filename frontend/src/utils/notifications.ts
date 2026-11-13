import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit } from '../types';
import { storage } from './storage';
import { getReminderCopy, ReminderType } from './reminderCopy';
import {
  REMINDER_LEAD_STEPS,
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  NOTIFICATION_CATEGORY_REMINDER,
  STORAGE_KEY_CONFIRMED_HABITS,
} from '../constants/reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Tạo kênh thông báo cho hệ điều hành Android (bắt buộc từ Android 8.0+) */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[ensureChannel] Lỗi cấu hình kênh thông báo Android:', msg);
  }

  try {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_REMINDER, [
      { identifier: 'CONFIRM_ACTION', buttonTitle: '✓ Xác nhận', options: { opensAppToForeground: false } },
      { identifier: 'OPEN_ACTION', buttonTitle: 'Làm ngay', options: { opensAppToForeground: true } },
    ]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[ensureChannel] Lỗi đăng ký category nút bấm (bỏ qua nếu không hỗ trợ):', msg);
  }
}

/** Đổi thứ từ chuẩn app (1=T2..7=CN) sang chuẩn Expo (1=CN, 2=T2..7=T7) */
function toExpoWeekday(appWeekday: number): number {
  const valid = Math.max(1, Math.min(7, Math.floor(appWeekday || 1)));
  return valid === 7 ? 1 : valid + 1;
}

/** Phân tích và kiểm tra tính hợp lệ của giờ nhắc nhở */
function parseAndValidateTime(timeStr: string): { hour: number; minute: number } {
  if (!timeStr || typeof timeStr !== 'string') return { hour: 8, minute: 0 };
  const parts = timeStr.trim().split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || h < 0 || h > 23) h = 8;
  if (isNaN(m) || m < 0 || m > 59) m = 0;
  return { hour: h, minute: m };
}

/** Tính giờ và phút lệch theo phút chỉ định */
function getOffsetTriggerTime(timeStr: string, offsetMinutes: number): { hour: number; minute: number } {
  const { hour: h, minute: m } = parseAndValidateTime(timeStr);
  let total = h * 60 + m + offsetMinutes;
  total = ((total % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

/** Sinh key lưu trữ riêng biệt theo từng thói quen để tránh giới hạn kích thước 2KB của SecureStore */
function getHabitStorageKey(habitId: string): string {
  const cleanId = habitId.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `h_nid_${cleanId}`;
}

async function getHabitNotificationIds(habitId: string): Promise<string[]> {
  try {
    const raw = await storage.getItem(getHabitStorageKey(habitId));
    return raw ? JSON.parse(raw) : [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[getHabitNotificationIds] Lỗi đọc ID thông báo:', msg);
    return [];
  }
}

async function saveHabitNotificationIds(habitId: string, ids: string[]): Promise<void> {
  try {
    await storage.setItem(getHabitStorageKey(habitId), JSON.stringify(ids));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[saveHabitNotificationIds] Lỗi lưu ID thông báo:', msg);
  }
}

async function removeHabitNotificationIds(habitId: string): Promise<void> {
  try {
    await storage.removeItem(getHabitStorageKey(habitId));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[removeHabitNotificationIds] Lỗi xoá ID thông báo:', msg);
  }
}

/** Lấy danh sách ID đã bấm xác nhận hôm nay */
export async function getConfirmedHabitIds(dateStr: string): Promise<string[]> {
  try {
    const raw = await storage.getItem(STORAGE_KEY_CONFIRMED_HABITS);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    return map[dateStr] || [];
  } catch {
    return [];
  }
}

/** Đánh dấu người dùng đã xác nhận thói quen hôm nay */
export async function markHabitConfirmed(habitId: string, dateStr: string): Promise<void> {
  try {
    const raw = await storage.getItem(STORAGE_KEY_CONFIRMED_HABITS);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const list = map[dateStr] || [];
    if (!list.includes(habitId)) {
      list.push(habitId);
      map[dateStr] = list;
      await storage.setItem(STORAGE_KEY_CONFIRMED_HABITS, JSON.stringify(map));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[markHabitConfirmed] Lỗi lưu trạng thái xác nhận:', msg);
  }
}

/** Kiểm tra trạng thái cấp quyền hiện tại */
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[getPermissionStatus] Lỗi kiểm tra quyền:', msg);
    return 'denied';
  }
}

/** Yêu cầu cấp quyền thông báo trên thiết bị di động */
export async function requestPermission(): Promise<'granted' | 'denied'> {
  if (Platform.OS === 'web') return 'denied';
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (granted) return 'granted';
    const req = await Notifications.requestPermissionsAsync();
    return req.granted ? 'granted' : 'denied';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[requestPermission] Lỗi xin quyền thông báo:', msg);
    return 'denied';
  }
}

/** Hủy toàn bộ lịch thông báo đã đặt của một thói quen */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const ids = await getHabitNotificationIds(habitId);
    for (const id of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (cancelErr: unknown) {
        const msg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
        console.warn(`[cancelHabitReminders] Lỗi hủy ID ${id}:`, msg);
      }
    }
    await removeHabitNotificationIds(habitId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[cancelHabitReminders] Lỗi xử lý:', msg);
  }
}

/** Đặt một lịch thông báo theo trigger daily hoặc weekly */
async function scheduleSingleTrigger(
  habit: Habit,
  type: ReminderType,
  offsetMinutes: number,
  minutesLeft?: number
): Promise<string[]> {
  const { hour, minute } = getOffsetTriggerTime(habit.reminderTime, offsetMinutes);
  const copy = getReminderCopy(habit, type, minutesLeft);
  const content = {
    title: copy.title,
    body: copy.body,
    data: { habitId: habit._id, type },
    categoryIdentifier: NOTIFICATION_CATEGORY_REMINDER,
  };
  const ids: string[] = [];
  const ch = NOTIFICATION_CHANNEL_ID;

  try {
    if (habit.frequency === 'daily') {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: ch },
      });
      ids.push(id);
    } else if (habit.frequency === 'weekly' && habit.daysOfWeek?.length) {
      for (const d of habit.daysOfWeek) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: toExpoWeekday(d), hour, minute, channelId: ch },
        });
        ids.push(id);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scheduleSingleTrigger] Lỗi đặt trigger (${type}, offset ${offsetMinutes}m):`, msg);
  }
  return ids;
}

/** Đặt lịch thông báo lặp tự động ngoài ứng dụng cho một thói quen */
export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  if (Platform.OS === 'web' || !habit.reminderEnabled || habit.status !== 'active') return [];
  try {
    await cancelHabitReminders(habit._id);
    await ensureChannel();
    const ids: string[] = [];
    const leadMinutes = habit.reminderLeadMinutes || 10;
    const repeatCount = Math.min(Math.max(1, habit.reminderRepeatCount || 1), Math.max(1, leadMinutes - 1));
    const steps: number[] = [];
    for (let i = 0; i < repeatCount; i++) {
      steps.push(leadMinutes - i);
    }
    for (const lead of steps) {
      const stepIds = await scheduleSingleTrigger(habit, 'pre', -lead, lead);
      ids.push(...stepIds);
    }
    const startIds = await scheduleSingleTrigger(habit, 'start', 0);
    ids.push(...startIds);
    if (habit.goalType === 'duration' && habit.targetValue > 0) {
      const durationIds = await scheduleSingleTrigger(habit, 'duration_end', habit.targetValue);
      ids.push(...durationIds);
    }
    await saveHabitNotificationIds(habit._id, ids);
    return ids;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scheduleHabitReminders] Lỗi đặt nhắc nhở cho "${habit.title}":`, msg);
    return [];
  }
}

/** Hủy toàn bộ lịch thông báo hệ thống */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[cancelAllReminders] Lỗi hủy toàn bộ:', msg);
  }
}

/** Đặt lại lịch thông báo cho toàn bộ thói quen đang hoạt động */
export async function rescheduleAll(habits: Habit[]): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelAllReminders();
    const active = habits.filter((h) => h.status === 'active' && h.reminderEnabled);
    await Promise.all(active.map((h) => scheduleHabitReminders(h)));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[rescheduleAll] Lỗi đặt lại toàn bộ:', msg);
  }
}

/** Gửi thông báo thử nghiệm sau 10 giây trên thiết bị */
export async function scheduleTestNotification(habitTitle: string = 'Uống nước ấm'): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Thử nghiệm nhắc nhở (10 giây)',
        body: `Đã đến giờ thực hiện thói quen "${habitTitle}"!`,
        data: { habitId: 'test_reminder' },
        categoryIdentifier: NOTIFICATION_CATEGORY_REMINDER,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: NOTIFICATION_CHANNEL_ID },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[scheduleTestNotification] Lỗi gửi thông báo test:', msg);
  }
}
