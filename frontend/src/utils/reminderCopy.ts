import { Habit } from '../types';

export type ReminderType = 'pre' | 'start' | 'duration_end';

export interface ReminderCopy {
  title: string;
  body: string;
  icon: string;
}

/** Phân loại loại thói quen dựa trên danh mục và tiêu đề */
function getHabitCategoryType(habit: Habit): 'water' | 'exercise' | 'reading' | 'mind' | 'default' {
  const code = (habit.categoryCode || '').toLowerCase();
  const title = habit.title.toLowerCase();
  if (code === 'health' || title.includes('nước')) return 'water';
  if (title.includes('bộ') || title.includes('dục') || title.includes('chạy')) return 'exercise';
  if (code === 'study' || title.includes('sách') || title.includes('đọc')) return 'reading';
  if (code === 'mind' || title.includes('thiền') || title.includes('thở')) return 'mind';
  return 'default';
}

/** Trả về nội dung nhắc nhở thân thiện theo từng loại và thời điểm */
export function getReminderCopy(
  habit: Habit,
  reminderType: ReminderType = 'pre',
  minutesLeft?: number
): ReminderCopy {
  const time = habit.reminderTime;
  if (reminderType === 'start') {
    return {
      title: `🚀 Bắt đầu nhiệm vụ: ${habit.title}!`,
      body: `Đã đến giờ (${time}). Hãy bắt đầu thực hiện ngay nhé!`,
      icon: 'zap',
    };
  }

  if (reminderType === 'duration_end') {
    return {
      title: `⏳ Đã hết ${habit.targetValue} ${habit.unit || 'phút'}: ${habit.title}!`,
      body: `Thời gian đã hoàn tất. Vào tích hoàn thành để giữ vững chuỗi nhé!`,
      icon: 'check-circle',
    };
  }

  const type = getHabitCategoryType(habit);
  const minText = minutesLeft ? ` (còn ${minutesLeft} phút)` : '';
  switch (type) {
    case 'water':
      return { title: `💧 Khởi động ngày mới nào!${minText}`, body: `Chuẩn bị uống nước ấm thanh lọc cơ thể (${time}).`, icon: 'droplet' };
    case 'exercise':
      return { title: `👟 Sắp đến giờ vận động!${minText}`, body: `Chuẩn bị 15-30 phút rèn luyện sức khỏe nhé (${time}).`, icon: 'activity' };
    case 'reading':
      return { title: `📖 Thời gian cho bản thân sắp đến${minText}`, body: `Dành ít phút đọc sách và mở mang tư duy (${time}).`, icon: 'book-open' };
    case 'mind':
      return { title: `🧘 Dành vài phút cho tâm trí${minText}`, body: `Hít thở sâu và thư giãn tinh thần một chút (${time}).`, icon: 'smile' };
    default:
      return { title: `⏰ Sắp đến giờ: ${habit.title}${minText}`, body: `Đừng quên thói quen "${habit.title}" lúc ${time} nhé.`, icon: 'bell' };
  }
}
