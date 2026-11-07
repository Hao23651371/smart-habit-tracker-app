/**
 * Định nghĩa Type/Interface cho Smart Habit Tracker
 * Khớp 100% với MongoDB CSDL và đặc tả kỹ thuật dự án.
 */

export interface UserOnboarding {
  completed: boolean;
  goals: string[];
  level: 'gentle' | 'moderate' | 'challenging';
  reminderSlots: string[];
}

export interface UserSettings {
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  onboarding: UserOnboarding;
  settings: UserSettings;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  id?: string;
  userId: string | null;
  name: string;
  code: string; // 'health' | 'study' | 'sleep' | 'mind' | 'work' | 'finance'
  icon: string;
  color: string;
  isDefault: boolean;
}

export type HabitFrequency = 'daily' | 'weekly';
export type HabitGoalType = 'check' | 'count' | 'duration';
export type HabitStatus = 'active' | 'archived';
export type HabitTimeSlot = 'morning' | 'noon' | 'afternoon' | 'evening';
export type HabitSource = 'manual' | 'ai' | 'template';

export interface Habit {
  _id: string;
  id?: string;
  userId: string;
  categoryId?: string;
  categoryCode: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[]; // 1=T2, 2=T3, ..., 7=CN
  reminderTime: string;  // "HH:mm"
  reminderEnabled: boolean;
  timeSlot: HabitTimeSlot;
  goalType: HabitGoalType;
  targetValue: number;
  unit?: string;
  status: HabitStatus;
  source: HabitSource;
  createdAt: string;
  archivedAt?: string;
}

export type HabitLogStatus = 'done' | 'skipped';

export interface HabitLog {
  _id: string;
  id?: string;
  userId: string;
  habitId: string;
  date: string; // Định dạng chuẩn: "YYYY-MM-DD"
  status: HabitLogStatus;
  value?: number;
  currentValue?: number;
  note?: string;
  completedAt?: string;
  loggedAt?: string;
}

export type AchievementGroup = 'start' | 'streak' | 'total' | 'special';

export interface AchievementCondition {
  type: string; // 'FIRST_HABIT' | 'TOTAL_DONE' | 'STREAK' | 'PERFECT_DAY' | 'PERFECT_WEEK'
  value: number;
}

export interface Achievement {
  _id: string;
  id?: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  group: AchievementGroup;
  condition: AchievementCondition;
}

export interface UserAchievement {
  _id: string;
  id?: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  achievement?: Achievement;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  _id: string;
  id?: string;
  userId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  actionButton?: {
    label: string;
    action: string;
    value?: string;
  };
}

export interface Suggestion {
  id: string;
  title: string;
  tag: string;
  frequency: HabitFrequency;
  timeSlot: HabitTimeSlot;
  defaultTime: string;
  reason: string;
  matchLabel: 'Rất phù hợp' | 'Phù hợp';
  categoryCode: string;
  plan7Days: string[];
}

export interface HabitWithTodayStatus extends Habit {
  isDoneToday: boolean;
  isSkippedToday: boolean;
  todayLog?: HabitLog;
  currentStreak: number;
  weekProgress: boolean[]; // 7 ngày trong tuần hiện tại
}

export interface HabitStats {
  totalHabits: number;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;      // Tỉ lệ hoàn thành (%)
  weeklyRate: number;          // Tỉ lệ tuần này (%)
  perfectDaysCount: number;    // Số ngày hoàn thành 100%
  bestHabit?: Habit;
  worstHabit?: Habit;
}
