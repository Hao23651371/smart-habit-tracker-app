import { ChatMessage, Suggestion } from '../types';
import { computeHabitStats } from '../utils/habitStats';
import { mockHabits } from './habits';
import { mockHabitLogs } from './logs';

// Lấy thống kê động từ logs thực tế - không hard-code số
const stats = computeHabitStats(mockHabits, mockHabitLogs);

export const mockChatMessages: ChatMessage[] = [
  {
    _id: 'msg_1',
    id: 'msg_1',
    userId: 'usr_an_123456',
    role: 'assistant',
    content: `Chào An! Mình là Trợ lý thói quen AI ✨. Mình thấy tỉ lệ duy trì tuần này của bạn đạt ${stats.weeklyRate}% với chuỗi ${stats.currentStreak} ngày liên tiếp rất tuyệt vời! Hôm nay bạn cần hỗ trợ gì về thói quen không?`,
    createdAt: '2026-11-07T08:00:00Z',
  },
];

export const quickChatPrompts = [
  'Tuần này mình làm thế nào?',
  'Tôi hay quên đọc sách, nên làm gì?',
  'Làm sao giữ chuỗi lâu hơn?',
];

export const mockAiReplies: Record<
  string,
  { content: string; actionButton?: { label: string; action: string; value?: string } }
> = {
  'Tuần này mình làm thế nào?': {
    content: `Tuần này bạn đã hoàn thành ${stats.weeklyRate}% mục tiêu với chuỗi ${stats.currentStreak} ngày liên tiếp! Bạn làm rất tốt thói quen buổi sáng (Uống nước ấm, Đi bộ, Hít thở sâu). Hãy tiếp tục hoàn thành các thói quen buổi tối nhé!`,
    actionButton: {
      label: 'Đổi giờ sang 20:00',
      action: 'UPDATE_TIME',
      value: '20:00',
    },
  },
  'Tôi hay quên đọc sách, nên làm gì?': {
    content:
      'Để không quên đọc sách, hãy gắn nó vào một thói quen sẵn có (Habit Stacking): Ví dụ ngay sau khi uống trà tối lúc 20:00, hãy cầm cuốn sách lên ngay. Bạn có muốn đổi giờ nhắc nhở lên 20:00 không?',
    actionButton: {
      label: 'Đổi giờ nhắc nhở 20:00',
      action: 'UPDATE_TIME',
      value: '20:00',
    },
  },
  'Làm sao giữ chuỗi lâu hơn?': {
    content: `Quy tắc vàng để giữ chuỗi ${stats.currentStreak} ngày của bạn: "Không bao giờ bỏ lỡ 2 ngày liên tiếp" (Never miss twice). Nếu một hôm quá bận, chỉ cần đọc 1 trang sách thay vì 5 trang để duy trì nhịp độ!`,
  },
};

export const mockSuggestions: Suggestion[] = [
  {
    id: 'sug_1',
    title: 'Tắt màn hình trước khi ngủ 30 phút',
    tag: 'Cải thiện giấc ngủ',
    frequency: 'daily',
    timeSlot: 'evening',
    defaultTime: '22:00',
    reason: 'Giảm ánh sáng xanh từ điện thoại giúp não tiết ra melatonin tự nhiên, dễ vào giấc ngủ sâu hơn.',
    matchLabel: 'Rất phù hợp',
    categoryCode: 'sleep',
    plan7Days: [
      'Giai đoạn 1 (Ngày 1-2): Bật chế độ không làm phiền lúc 22:00.',
      'Giai đoạn 2 (Ngày 3-5): Để điện thoại cách xa giường ngủ ít nhất 2 mét.',
      'Giai đoạn 3 (Ngày 6-7): Thay thế lướt mạng xã hội bằng nghe nhạc êm dịu hoặc đọc sách.',
    ],
  },
  {
    id: 'sug_2',
    title: 'Viết 3 điều biết ơn mỗi tối',
    tag: 'Sức khỏe tinh thần',
    frequency: 'daily',
    timeSlot: 'evening',
    defaultTime: '21:15',
    reason: 'Ghi nhận những điều tích cực trong ngày giúp giảm bớt lo âu và tăng cảm giác bình an.',
    matchLabel: 'Rất phù hợp',
    categoryCode: 'mind',
    plan7Days: [
      'Giai đoạn 1 (Ngày 1-2): Ghi lại 1 điều khiến bạn mỉm cười trong ngày.',
      'Giai đoạn 2 (Ngày 3-4): Mở rộng thành 2 điều về công việc và người xung quanh.',
      'Giai đoạn 3 (Ngày 5-7): Viết đều đặn 3 điều biết ơn vào sổ tay nhỏ trước khi ngủ.',
    ],
  },
  {
    id: 'sug_3',
    title: 'Uống đủ 2 lít nước mỗi ngày',
    tag: 'Hydrat hóa cơ thể',
    frequency: 'daily',
    timeSlot: 'afternoon',
    defaultTime: '15:00',
    reason: 'Nước giúp duy trì sự tỉnh táo vào buổi chiều và hỗ trợ tuần hoàn tốt hơn.',
    matchLabel: 'Phù hợp',
    categoryCode: 'health',
    plan7Days: [
      'Giai đoạn 1 (Ngày 1-2): Chuẩn bị bình nước 1 lít đặt ngay bàn làm việc.',
      'Giai đoạn 2 (Ngày 3-4): Uống hết bình thứ nhất vào buổi sáng và tiếp tục bình thứ hai.',
      'Giai đoạn 3 (Ngày 5-7): Duy trì thói quen uống từng ngụm nhỏ suốt cả ngày.',
    ],
  },
];
