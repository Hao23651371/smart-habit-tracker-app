/**
 * Hằng số cấu hình hệ thống nhắc nhở thói quen
 */

// Các mốc nhắc trước giờ hẹn (phút) - nhắc ở 10p, 9p, 8p nếu chưa xác nhận
export const REMINDER_LEAD_STEPS = [10, 9, 8] as const;
export const REMINDER_LEAD_MINUTES = 10;

// ID và tên kênh thông báo trên Android (bắt buộc cho Android 8.0+)
export const NOTIFICATION_CHANNEL_ID = 'habit-reminders';
export const NOTIFICATION_CHANNEL_NAME = 'Nhắc nhở thói quen';
export const NOTIFICATION_CATEGORY_REMINDER = 'habit_reminder_category';

// Key lưu trữ danh sách mã thông báo và thói quen đã xác nhận trong storage
export const STORAGE_KEY_HABIT_NOTIFICATIONS = 'habit_notification_ids_map';
export const STORAGE_KEY_CONFIRMED_HABITS = 'habit_confirmed_reminders_map';

// Thời gian hiển thị banner trong ứng dụng (mili giây) - tăng thêm 3s theo yêu cầu
export const IN_APP_BANNER_DURATION_MS = 9000; // 9 giây (tăng thêm 3s từ 6s)
export const START_BANNER_DURATION_MS = 8000; // 8 giây (tăng thêm 3s từ 5s)

// Chu kỳ kiểm tra giờ nhắc nhở trong ứng dụng (mili giây)
export const IN_APP_CHECK_INTERVAL_MS = 15000;
