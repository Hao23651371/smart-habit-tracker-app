import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  TextField,
  PrimaryButton,
  BottomSheet,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { DEFAULT_CATEGORIES as mockCategories } from '../../constants/categories';
import { Habit, HabitFrequency, HabitGoalType, HabitTimeSlot } from '../../types';
import {
  requestPermission,
  scheduleHabitReminders,
  cancelHabitReminders,
} from '../../utils/notifications';

const COLOR_OPTIONS = ['#22C55E', '#7C5CFC', '#6366F1', '#F59E0B', '#0EA5E9', '#EC4899', '#14B8A6'];
const ICON_OPTIONS = ['activity', 'book-open', 'droplet', 'moon', 'sun', 'zap', 'coffee', 'heart'];

export const TIME_SLOT_CONFIG: Record<
  HabitTimeSlot,
  {
    label: string;
    rangeText: string;
    defaultTime: string;
    suggestions: string[];
  }
> = {
  morning: {
    label: 'Sáng',
    rangeText: '05:00 - 11:00',
    defaultTime: '07:30',
    suggestions: ['06:30', '07:00', '07:30', '08:00', '09:00'],
  },
  noon: {
    label: 'Trưa',
    rangeText: '11:00 - 13:30',
    defaultTime: '12:00',
    suggestions: ['11:30', '11:45', '12:00', '12:15', '12:30', '13:00'],
  },
  afternoon: {
    label: 'Chiều',
    rangeText: '13:30 - 18:00',
    defaultTime: '15:00',
    suggestions: ['14:00', '15:00', '16:00', '17:00'],
  },
  evening: {
    label: 'Tối',
    rangeText: '18:00 - 23:59',
    defaultTime: '20:30',
    suggestions: ['19:30', '20:00', '20:30', '21:15', '21:30', '22:00'],
  },
};

export const LEAD_TIME_OPTIONS = [
  { val: 10, label: 'Trước 10 phút' },
  { val: 5, label: 'Trước 5 phút' },
  { val: 3, label: 'Trước 3 phút' },
];

export interface CategoryGoalInfo {
  name: string;
  defaultUnit: string;
  suggestedUnits: string[];
  suggestedCount: string;
  bestFitGoal: HabitGoalType;
  checkExample: string;
  countExample: string;
  durationExample: string;
  tip: string;
}

export const CATEGORY_GOAL_CONFIG: Record<string, CategoryGoalInfo> = {
  health: {
    name: 'Sức khỏe',
    defaultUnit: 'ly',
    suggestedUnits: ['ly', 'bước', 'km', 'lần', 'bữa'],
    suggestedCount: '8',
    bestFitGoal: 'count',
    checkExample: 'Ăn bữa sáng lành mạnh, uống vitamin',
    countExample: 'Uống 8 ly nước, đi bộ 6000 bước, hít đất 20 cái',
    durationExample: 'Chạy bộ 30 phút, tập yoga 20 phút',
    tip: 'Phù hợp nhất với "Đếm số lượng" (ly nước, bước chân) hoặc "Thời lượng" khi tập thể dục.',
  },
  study: {
    name: 'Học tập',
    defaultUnit: 'trang',
    suggestedUnits: ['trang', 'từ', 'bài', 'chương', 'video'],
    suggestedCount: '10',
    bestFitGoal: 'count',
    checkExample: 'Ôn bài cũ trước khi ngủ, giải bài tập lớn',
    countExample: 'Đọc 10 trang sách, học 15 từ vựng tiếng Anh',
    durationExample: 'Tự học lập trình 45 phút, luyện nghe 25 phút',
    tip: 'Phù hợp với "Đếm số lượng" khi đọc sách/từ vựng, hoặc "Thời lượng" khi tự học tập trung.',
  },
  sleep: {
    name: 'Giấc ngủ',
    defaultUnit: 'lần',
    suggestedUnits: ['lần', 'giờ', 'giấc'],
    suggestedCount: '1',
    bestFitGoal: 'check',
    checkExample: 'Đi ngủ trước 23h, không lướt điện thoại 30 phút trước ngủ',
    countExample: 'Ngủ trưa 1 giấc ngắn đúng giờ',
    durationExample: 'Ngủ trưa phục hồi 20 phút, nghe nhạc thư giãn 15 phút',
    tip: 'Phù hợp nhất với "Check hoàn thành" hoặc "Thời lượng" cho giấc ngủ trưa.',
  },
  mind: {
    name: 'Tinh thần',
    defaultUnit: 'lần',
    suggestedUnits: ['lần', 'điều', 'trang', 'phút'],
    suggestedCount: '3',
    bestFitGoal: 'duration',
    checkExample: 'Viết nhật ký biết ơn, gửi tin nhắn cảm ơn ai đó',
    countExample: 'Viết 3 điều biết ơn, hít thở sâu 5 lần',
    durationExample: 'Thiền tĩnh tâm 10 phút, đi dạo thư giãn 15 phút',
    tip: 'Phù hợp với "Thời lượng" khi thiền/nghỉ ngơi hoặc "Đếm số lượng" khi viết điều biết ơn.',
  },
  work: {
    name: 'Công việc',
    defaultUnit: 'task',
    suggestedUnits: ['task', 'việc', 'email', 'cuộc gọi', 'pomodoro'],
    suggestedCount: '5',
    bestFitGoal: 'count',
    checkExample: 'Lập danh sách công việc đầu ngày, dọn sạch bàn làm việc',
    countExample: 'Hoàn thành 5 task quan trọng, xử lý 10 email tồn đọng',
    durationExample: 'Tập trung làm việc Deep Work 45 phút không xao nhãng',
    tip: 'Phù hợp nhất với "Đếm số lượng" (số task, pomodoro) hoặc "Thời lượng" tập trung.',
  },
  finance: {
    name: 'Tài chính',
    defaultUnit: 'lần',
    suggestedUnits: ['lần', 'khoản', 'giao dịch', 'k'],
    suggestedCount: '1',
    bestFitGoal: 'check',
    checkExample: 'Ghi chép toàn bộ chi tiêu hôm nay, không mua sắm ngoài kế hoạch',
    countExample: 'Ghi lại 3 khoản chi, bỏ heo tiết kiệm 50k',
    durationExample: 'Kiểm toán & cân đối ngân sách tuần 15 phút',
    tip: 'Phù hợp nhất với "Check hoàn thành" (ghi chi tiêu hàng ngày) hoặc "Đếm số lượng".',
  },
};

function parseTimeMinutes(timeStr: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr.trim());
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function getSlotOfTime(timeStr: string): HabitTimeSlot | null {
  const mins = parseTimeMinutes(timeStr);
  if (mins === null) return null;
  if (mins >= 5 * 60 && mins < 11 * 60) return 'morning';
  if (mins >= 11 * 60 && mins < 13 * 60 + 30) return 'noon';
  if (mins >= 13 * 60 + 30 && mins < 18 * 60) return 'afternoon';
  return 'evening';
}

export default function HabitFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    categoryCode?: string;
    frequency?: string;
    timeSlot?: string;
    reminderTime?: string;
  }>();

  const { habits, createHabit, updateHabit } = useHabits();
  const isEditing = Boolean(params.id);

  // Tìm thói quen cũ nếu là đang sửa
  const existingHabit = isEditing ? habits.find((h) => h._id === params.id) : undefined;

  // Form states
  const [title, setTitle] = useState(params.title || existingHabit?.title || '');
  const [description, setDescription] = useState(params.description || existingHabit?.description || '');
  const [categoryCode, setCategoryCode] = useState(
    params.categoryCode || existingHabit?.categoryCode || 'health'
  );
  const [frequency, setFrequency] = useState<HabitFrequency>(
    (params.frequency as HabitFrequency) || existingHabit?.frequency || 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    existingHabit?.daysOfWeek || [1, 2, 3, 4, 5, 6, 7]
  );
  const [reminderTime, setReminderTime] = useState(
    params.reminderTime || existingHabit?.reminderTime || '07:30'
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    existingHabit ? existingHabit.reminderEnabled : true
  );
  const [timeSlot, setTimeSlot] = useState<HabitTimeSlot>(
    (params.timeSlot as HabitTimeSlot) || existingHabit?.timeSlot || 'morning'
  );
  const [goalType, setGoalType] = useState<HabitGoalType>(
    existingHabit?.goalType || 'check'
  );
  const [targetValue, setTargetValue] = useState<string>(
    String(existingHabit?.targetValue || '1')
  );

  const initialCat = params.categoryCode || existingHabit?.categoryCode || 'health';
  const initialGt = (existingHabit?.goalType || 'check') as HabitGoalType;
  const defaultCatUnit = CATEGORY_GOAL_CONFIG[initialCat]?.defaultUnit || 'lần';

  const [unit, setUnit] = useState<string>(
    existingHabit?.unit ||
      (initialGt === 'duration' ? 'phút' : initialGt === 'count' ? defaultCatUnit : 'lần')
  );
  const [showGoalGuide, setShowGoalGuide] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>(
    existingHabit?.color || '#7C5CFC'
  );
  const [selectedIcon, setSelectedIcon] = useState<string>(
    existingHabit?.icon || 'activity'
  );
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState<number>(
    existingHabit?.reminderLeadMinutes ?? 10
  );
  const [reminderRepeatCount, setReminderRepeatCount] = useState<string>(
    String(existingHabit?.reminderRepeatCount ?? 1)
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<string>('');
  const [daysError, setDaysError] = useState<string>('');
  const [reminderTimeError, setReminderTimeError] = useState<string>('');
  const [targetValueError, setTargetValueError] = useState<string>('');
  const [repeatCountError, setRepeatCountError] = useState<string>('');

  const validateReminderTime = (timeVal: string, slotVal: HabitTimeSlot): string => {
    if (!timeVal.trim()) {
      return 'Vui lòng nhập giờ nhắc nhở (HH:mm)';
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeVal.trim())) {
      return 'Định dạng giờ không hợp lệ. Vui lòng nhập theo dạng HH:mm (ví dụ 07:30 hoặc 12:00)';
    }
    const actualSlot = getSlotOfTime(timeVal);
    if (actualSlot && actualSlot !== slotVal) {
      const actualInfo = TIME_SLOT_CONFIG[actualSlot];
      const expectedInfo = TIME_SLOT_CONFIG[slotVal];
      return `Giờ ${timeVal} thuộc buổi ${actualInfo.label} (${actualInfo.rangeText}), không khớp với khung giờ ${expectedInfo.label} đã chọn (${expectedInfo.rangeText})!`;
    }
    return '';
  };

  const validateRepeatCount = (countVal: string, leadMinutes: number): string => {
    const n = parseInt(countVal, 10);
    if (isNaN(n) || n <= 0) {
      return 'Số lần nhắc nhở phải là số lớn hơn 0.';
    }
    if (n >= leadMinutes) {
      return `Số lần nhắc nhở (${n} lần) phải nhỏ hơn thời gian nhắc trước (${leadMinutes} phút) để đảm bảo không bị quá giờ hẹn!`;
    }
    return '';
  };

  const handleSelectSlot = (newSlot: HabitTimeSlot) => {
    setTimeSlot(newSlot);
    const err = validateReminderTime(reminderTime, newSlot);
    setReminderTimeError(err);
  };

  const handleSelectLeadMinutes = (lead: number) => {
    setReminderLeadMinutes(lead);
    const currentCount = parseInt(reminderRepeatCount, 10) || 1;
    if (currentCount >= lead) {
      const safeCount = Math.max(1, lead - 1);
      setReminderRepeatCount(String(safeCount));
      setRepeatCountError('');
    } else {
      const err = validateRepeatCount(reminderRepeatCount, lead);
      setRepeatCountError(err);
    }
  };

  const toggleDay = (dayNum: number) => {
    let nextDays: number[];
    if (selectedDays.includes(dayNum)) {
      nextDays = selectedDays.filter((d) => d !== dayNum);
    } else {
      nextDays = [...selectedDays, dayNum].sort();
    }
    setSelectedDays(nextDays);
    if (nextDays.length > 0 && daysError) {
      setDaysError('');
    }
  };

  const handleSelectCategory = (newCatCode: string, newCatColor?: string) => {
    setCategoryCode(newCatCode);
    if (newCatColor) setSelectedColor(newCatColor);

    const goalCfg = CATEGORY_GOAL_CONFIG[newCatCode];
    if (goalCfg && goalType === 'count') {
      setUnit(goalCfg.defaultUnit);
      if (!targetValue || targetValue === '1') {
        setTargetValue(goalCfg.suggestedCount);
      }
    }
  };

  const handleSelectGoalType = (gtId: HabitGoalType) => {
    setGoalType(gtId);
    const goalCfg = CATEGORY_GOAL_CONFIG[categoryCode];
    if (gtId === 'duration') {
      setUnit('phút');
      if (!targetValue || targetValue === '1') {
        setTargetValue('15');
      }
    } else if (gtId === 'count') {
      setUnit(goalCfg?.defaultUnit || 'lần');
      if (!targetValue || targetValue === '1') {
        setTargetValue(goalCfg?.suggestedCount || '5');
      }
    } else {
      setUnit('lần');
      setTargetValue('1');
    }
    if (targetValueError) setTargetValueError('');
  };

  const syncHabitReminder = async (habit: Habit) => {
    try {
      if (habit.reminderEnabled && habit.status === 'active') {
        await requestPermission();
        await scheduleHabitReminders(habit);
      } else {
        await cancelHabitReminders(habit._id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[syncHabitReminder] Lỗi đồng bộ thông báo:', msg);
      throw err;
    }
  };

  const handleSave = async () => {
    let hasError = false;

    // Ràng buộc 1: Tên thói quen không được rỗng
    if (!title.trim()) {
      setTitleError('Vui lòng nhập tên thói quen');
      hasError = true;
    } else if (title.trim().length < 2) {
      setTitleError('Tên thói quen phải có ít nhất 2 ký tự');
      hasError = true;
    } else {
      setTitleError('');
    }

    // Ràng buộc 2: Tần suất tuần phải có ít nhất 1 ngày
    if (frequency === 'weekly' && selectedDays.length === 0) {
      setDaysError('Vui lòng chọn ít nhất một ngày trong tuần');
      hasError = true;
    } else {
      setDaysError('');
    }

    // Ràng buộc 3: Nếu bật nhắc nhở, kiểm tra định dạng và khung giờ
    if (reminderEnabled) {
      const timeErr = validateReminderTime(reminderTime, timeSlot);
      if (timeErr) {
        setReminderTimeError(timeErr);
        hasError = true;
      } else {
        setReminderTimeError('');
      }

      // Ràng buộc 4: Số lần nhắc nhở lặp lại phải nhỏ hơn số phút nhắc trước
      const repErr = validateRepeatCount(reminderRepeatCount, reminderLeadMinutes);
      if (repErr) {
        setRepeatCountError(repErr);
        hasError = true;
      } else {
        setRepeatCountError('');
      }
    }

    // Ràng buộc 5: Kiểm tra mục tiêu khi là duration hoặc count
    if (goalType === 'duration') {
      const val = parseInt(targetValue, 10);
      if (!targetValue.trim()) {
        setTargetValueError('Vui lòng nhập thời lượng mục tiêu (phút)');
        hasError = true;
      } else if (isNaN(val) || val <= 0) {
        setTargetValueError('Thời lượng phải là số nguyên lớn hơn 0 (ví dụ: 15, 30 phút)');
        hasError = true;
      } else if (val > 360) {
        setTargetValueError('Thời lượng tối đa là 360 phút (6 giờ). Vui lòng nhập số phút hợp lý!');
        hasError = true;
      } else {
        setTargetValueError('');
      }
    } else if (goalType === 'count') {
      const val = parseInt(targetValue, 10);
      if (!targetValue.trim()) {
        setTargetValueError('Vui lòng nhập số lượng mục tiêu');
        hasError = true;
      } else if (isNaN(val) || val <= 0) {
        setTargetValueError('Số lượng mục tiêu phải là số lớn hơn 0');
        hasError = true;
      } else {
        setTargetValueError('');
      }
    } else {
      setTargetValueError('');
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    let saved: Habit | null = null;

    // BƯỚC 1: Lưu dữ liệu thói quen trước
    try {
      const habitPayload: Partial<Habit> = {
        title: title.trim(),
        description: description.trim(),
        categoryCode,
        frequency,
        daysOfWeek: frequency === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : selectedDays,
        reminderTime,
        reminderEnabled,
        reminderLeadMinutes,
        reminderRepeatCount: parseInt(reminderRepeatCount, 10) || 1,
        timeSlot,
        goalType,
        targetValue: parseInt(targetValue, 10) || 1,
        unit: goalType === 'duration' ? 'phút' : goalType === 'count' ? (unit.trim() || 'lần') : 'lần',
        color: selectedColor,
        icon: selectedIcon,
      };

      saved = isEditing && existingHabit
        ? await updateHabit({ id: existingHabit._id, updates: habitPayload })
        : await createHabit(habitPayload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[handleSave] Lỗi lưu thói quen vào CSDL:', msg);
      Alert.alert('Lỗi', 'Không thể lưu thói quen');
      setLoading(false);
      return;
    }

    // BƯỚC 2: Đặt lịch thông báo tách biệt (lỗi thông báo không làm hỏng lưu thói quen)
    let reminderErrorOccurred = false;
    try {
      if (saved) {
        await syncHabitReminder(saved);
      }
    } catch (err: unknown) {
      reminderErrorOccurred = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[handleSave] Lỗi đặt lịch thông báo thói quen:', msg);
    }

    setLoading(false);

    // BƯỚC 3: Báo kết quả cho người dùng
    if (reminderErrorOccurred) {
      Alert.alert(
        'Đã lưu thói quen',
        'Đã lưu thông tin thói quen thành công, nhưng chưa đặt được lịch nhắc nhở trên thiết bị.',
        [{ text: 'Đồng ý', onPress: () => router.back() }]
      );
    } else {
      const successMsg = isEditing ? 'Đã cập nhật thói quen thành công!' : 'Đã tạo thói quen mới thành công!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.back();
      } else {
        Alert.alert(
          'Thành công 🎉',
          successMsg,
          [{ text: 'Tuyệt vời', onPress: () => router.back() }]
        );
      }
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title={isEditing ? 'Chỉnh sửa thói quen' : 'Thêm thói quen mới'}
        showBack
        onBackPress={() => router.back()}
      />

      <View style={styles.formCard}>
        {/* Tên thói quen */}
        <TextField
          label="Tên thói quen *"
          placeholder="Ví dụ: Đọc sách 15 phút"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (text.trim() && titleError) setTitleError('');
          }}
          error={titleError}
        />

        {/* Mô tả */}
        <TextField
          label="Mô tả / Động lực (tuỳ chọn)"
          placeholder="Lý do hoặc ghi chú nhỏ để nhắc nhở bản thân..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          style={{ height: 60 }}
        />

        {/* Danh mục */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Danh mục</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {mockCategories.map((cat) => {
              const isSelected = categoryCode === cat.code;
              return (
                <TouchableOpacity
                  key={cat.code}
                  onPress={() => handleSelectCategory(cat.code, cat.color)}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                  ]}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.catText, isSelected && { color: cat.color, fontWeight: '700' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tần suất */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Tần suất</Text>
          <View style={styles.freqRow}>
            <TouchableOpacity
              onPress={() => setFrequency('daily')}
              style={[styles.freqOption, frequency === 'daily' && styles.freqOptionActive]}
            >
              <Text style={[styles.freqOptionText, frequency === 'daily' && styles.freqOptionTextActive]}>
                Mỗi ngày
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFrequency('weekly')}
              style={[styles.freqOption, frequency === 'weekly' && styles.freqOptionActive]}
            >
              <Text style={[styles.freqOptionText, frequency === 'weekly' && styles.freqOptionTextActive]}>
                Các ngày trong tuần
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chọn ngày trong tuần nếu weekly */}
          {frequency === 'weekly' && (
            <>
              <View style={styles.daysPickRow}>
                {[
                  { num: 1, label: 'T2' },
                  { num: 2, label: 'T3' },
                  { num: 3, label: 'T4' },
                  { num: 4, label: 'T5' },
                  { num: 5, label: 'T6' },
                  { num: 6, label: 'T7' },
                  { num: 7, label: 'CN' },
                ].map(({ num, label }) => {
                  const isSelected = selectedDays.includes(num);
                  return (
                    <TouchableOpacity
                      key={num}
                      onPress={() => toggleDay(num)}
                      style={[styles.dayPickCircle, isSelected && styles.dayPickCircleActive]}
                    >
                      <Text style={[styles.dayPickText, isSelected && styles.dayPickTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {Boolean(daysError) && (
                <Text style={styles.errorTextInline}>{daysError}</Text>
              )}
            </>
          )}
        </View>

        {/* Khung giờ & Giờ nhắc */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Khung giờ</Text>
          <View style={styles.slotsRow}>
            {[
              { id: 'morning', label: 'Sáng' },
              { id: 'noon', label: 'Trưa' },
              { id: 'afternoon', label: 'Chiều' },
              { id: 'evening', label: 'Tối' },
            ].map((slot) => {
              const isSelected = timeSlot === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => handleSelectSlot(slot.id as HabitTimeSlot)}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                >
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Gợi ý khung giờ trực quan */}
          <View style={styles.slotHintCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={styles.slotHintTitle}>
                Khung giờ {TIME_SLOT_CONFIG[timeSlot].label}: {TIME_SLOT_CONFIG[timeSlot].rangeText}
              </Text>
            </View>
            <Text style={styles.slotHintDesc}>
              Điền giờ nhắc nhở trong khoảng này hoặc bấm chọn nhanh bên dưới:
            </Text>
            <View style={styles.quickTimeChipsRow}>
              {TIME_SLOT_CONFIG[timeSlot].suggestions.map((suggestedTime) => {
                const isCurrent = reminderTime === suggestedTime;
                return (
                  <TouchableOpacity
                    key={suggestedTime}
                    onPress={() => {
                      setReminderTime(suggestedTime);
                      setReminderTimeError('');
                    }}
                    style={[
                      styles.quickTimeChip,
                      isCurrent && styles.quickTimeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickTimeText,
                        isCurrent && styles.quickTimeTextActive,
                      ]}
                    >
                      {suggestedTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Giờ nhắc nhở */}
        {reminderEnabled && (
          <View style={{ marginBottom: 14 }}>
            <TextField
              label="Giờ nhắc nhở (HH:mm) *"
              placeholder="07:30"
              value={reminderTime}
              onChangeText={(text) => {
                setReminderTime(text);
                const err = validateReminderTime(text, timeSlot);
                setReminderTimeError(err);
              }}
              error={reminderTimeError}
              leftIcon="clock"
            />

            {/* Nút hỗ trợ sửa nhanh nếu lệch khung giờ */}
            {(() => {
              const actualSlot = getSlotOfTime(reminderTime);
              if (reminderTimeError && actualSlot && actualSlot !== timeSlot) {
                const actualInfo = TIME_SLOT_CONFIG[actualSlot];
                return (
                  <View style={styles.quickFixBox}>
                    <TouchableOpacity
                      onPress={() => {
                        setTimeSlot(actualSlot);
                        setReminderTimeError('');
                      }}
                      style={styles.quickFixBtn}
                    >
                      <Feather name="check" size={14} color="#16A34A" />
                      <Text style={styles.quickFixBtnText}>
                        Đổi khung giờ sang {actualInfo.label} ({actualInfo.rangeText})
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null;
            })()}
          </View>
        )}

        {/* Bật/Tắt nhắc nhở */}
        <View style={styles.reminderToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Bật nhắc nhở</Text>
            <Text style={styles.fieldSubtitle}>
              {reminderEnabled
                ? `Nhắc trước ${reminderLeadMinutes} phút qua thông báo (lặp lại ${reminderRepeatCount} lần)`
                : 'Tắt toàn bộ thông báo nhắc nhở cho thói quen này'}
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Cấu hình nâng cao nhắc nhở (Thời gian nhắc trước & Số lần nhắc lặp lại) */}
        {reminderEnabled && (
          <View style={styles.reminderAdvanceCard}>
            {/* 1. Gợi ý chọn thời gian nhắc trước: 10 phút, 5 phút, 3 phút */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.subFieldLabel}>Thời gian nhắc trước giờ hẹn:</Text>
              <View style={styles.leadChipsRow}>
                {LEAD_TIME_OPTIONS.map((opt) => {
                  const isSelected = reminderLeadMinutes === opt.val;
                  return (
                    <TouchableOpacity
                      key={opt.val}
                      onPress={() => handleSelectLeadMinutes(opt.val)}
                      style={[
                        styles.leadChip,
                        isSelected && styles.leadChipActive,
                      ]}
                    >
                      <Feather
                        name="clock"
                        size={13}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.leadChipText,
                          isSelected && styles.leadChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Số lần nhắc nhở lặp lại mỗi phút (< reminderLeadMinutes) */}
            <View>
              <Text style={styles.subFieldLabel}>
                Số lần nhắc nhở (mỗi phút 1 lần):
              </Text>
              <Text style={styles.subFieldHint}>
                * Ràng buộc: Số lần nhắc nhở phải nhỏ hơn {reminderLeadMinutes} phút đã chọn!
              </Text>

              {/* Các chip chọn nhanh số lần hợp lệ */}
              <View style={styles.repeatChipsRow}>
                {(reminderLeadMinutes === 10
                  ? [1, 3, 5, 7, 9]
                  : reminderLeadMinutes === 5
                  ? [1, 2, 3, 4]
                  : [1, 2]
                ).map((cnt) => {
                  const isSelected = parseInt(reminderRepeatCount, 10) === cnt && !repeatCountError;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      onPress={() => {
                        setReminderRepeatCount(String(cnt));
                        setRepeatCountError('');
                      }}
                      style={[
                        styles.repeatChip,
                        isSelected && styles.repeatChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.repeatChipText,
                          isSelected && styles.repeatChipTextActive,
                        ]}
                      >
                        {cnt} lần
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Ô nhập tuỳ chỉnh số lần */}
              <TextField
                label="Hoặc nhập số lần nhắc nhở:"
                placeholder={`Nhập từ 1 đến ${reminderLeadMinutes - 1}`}
                value={reminderRepeatCount}
                keyboardType="numeric"
                onChangeText={(text) => {
                  setReminderRepeatCount(text);
                  const err = validateRepeatCount(text, reminderLeadMinutes);
                  setRepeatCountError(err);
                }}
                error={repeatCountError}
                leftIcon="repeat"
              />
            </View>
          </View>
        )}

        {/* Loại mục tiêu */}
        <View style={styles.fieldSection}>
          <View style={styles.goalTypeHeader}>
            <View>
              <Text style={styles.fieldLabel}>Loại mục tiêu</Text>
              <Text style={styles.fieldSubtitle}>
                Chọn cách đo lường phù hợp với thói quen
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowGoalGuide(true)}
              style={styles.guideBadgeBtn}
              activeOpacity={0.7}
            >
              <Feather name="help-circle" size={14} color={colors.primary} />
              <Text style={styles.guideBadgeText}>Hướng dẫn đặt mục tiêu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalTypeRow}>
            {[
              { id: 'check', label: 'Check hoàn thành' },
              { id: 'count', label: 'Đếm số lượng' },
              { id: 'duration', label: 'Thời lượng (phút)' },
            ].map((gt) => {
              const isSelected = goalType === gt.id;
              return (
                <TouchableOpacity
                  key={gt.id}
                  onPress={() => handleSelectGoalType(gt.id as HabitGoalType)}
                  style={[styles.goalTypeBtn, isSelected && styles.goalTypeBtnActive]}
                >
                  <Text style={[styles.goalTypeBtnText, isSelected && styles.goalTypeBtnTextActive]}>
                    {gt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nhập mục tiêu khi loại là Thời lượng (phút) - Bỏ hẳn ô đơn vị tính vì đã cố định là phút */}
        {goalType === 'duration' && (
          <View style={{ marginBottom: 14 }}>
            <TextField
              label="Thời lượng mục tiêu (phút) *"
              placeholder="Ví dụ: 15, 20, 30"
              value={targetValue}
              keyboardType="numeric"
              onChangeText={(text) => {
                setTargetValue(text);
                const n = parseInt(text, 10);
                if (!text.trim()) {
                  setTargetValueError('Vui lòng nhập thời lượng mục tiêu (phút)');
                } else if (isNaN(n) || n <= 0) {
                  setTargetValueError('Thời lượng phải là số nguyên lớn hơn 0 (ví dụ: 10, 15, 30 phút)');
                } else if (n > 360) {
                  setTargetValueError('Thời lượng tối đa là 360 phút (6 giờ/ngày). Vui lòng nhập số phút hợp lý!');
                } else {
                  setTargetValueError('');
                }
              }}
              error={targetValueError}
              leftIcon="clock"
            />

            {/* Chip gợi ý chọn nhanh thời lượng phổ biến */}
            <View style={{ marginTop: 6 }}>
              <Text style={styles.subFieldHint}>Gợi ý thời lượng phổ biến:</Text>
              <View style={styles.quickTimeChipsRow}>
                {[5, 10, 15, 20, 30, 45, 60].map((mins) => {
                  const isCurrent = targetValue === String(mins);
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => {
                        setTargetValue(String(mins));
                        setTargetValueError('');
                      }}
                      style={[
                        styles.quickTimeChip,
                        isCurrent && styles.quickTimeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickTimeText,
                          isCurrent && styles.quickTimeTextActive,
                        ]}
                      >
                        {mins} phút
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Nhập mục tiêu khi loại là Đếm số lượng */}
        {goalType === 'count' && (
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <View style={{ flex: 1.5 }}>
                <TextField
                  label="Số lượng mục tiêu *"
                  placeholder={`Ví dụ: ${CATEGORY_GOAL_CONFIG[categoryCode]?.suggestedCount || '5'}`}
                  value={targetValue}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    setTargetValue(text);
                    const n = parseInt(text, 10);
                    if (!text.trim()) {
                      setTargetValueError('Vui lòng nhập số lượng mục tiêu');
                    } else if (isNaN(n) || n <= 0) {
                      setTargetValueError('Số lượng mục tiêu phải là số lớn hơn 0');
                    } else {
                      setTargetValueError('');
                    }
                  }}
                  error={targetValueError}
                  leftIcon="hash"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Đơn vị tính"
                  placeholder="Ví dụ: ly, lần, bài"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            {/* Chip gợi ý đơn vị tính phù hợp với danh mục đang chọn */}
            {CATEGORY_GOAL_CONFIG[categoryCode] && (
              <View style={styles.unitSuggestionContainer}>
                <Text style={styles.unitSuggestionLabel}>
                  Gợi ý đơn vị cho danh mục {CATEGORY_GOAL_CONFIG[categoryCode].name}:
                </Text>
                <View style={styles.unitChipsRow}>
                  {CATEGORY_GOAL_CONFIG[categoryCode].suggestedUnits.map((u) => {
                    const isSelected = unit.trim().toLowerCase() === u.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setUnit(u)}
                        style={[
                          styles.unitChip,
                          isSelected && styles.unitChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            isSelected && styles.unitChipTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Chọn màu sắc & icon */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Màu sắc</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((col) => {
              const isSelected = selectedColor === col;
              return (
                <TouchableOpacity
                  key={col}
                  onPress={() => setSelectedColor(col)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: col },
                    isSelected && styles.colorCircleActive,
                  ]}
                >
                  {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Biểu tượng</Text>
          <View style={styles.iconRow}>
            {ICON_OPTIONS.map((ic) => {
              const isSelected = selectedIcon === ic;
              return (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setSelectedIcon(ic)}
                  style={[
                    styles.iconOptionBox,
                    isSelected && { backgroundColor: `${selectedColor}25`, borderColor: selectedColor },
                  ]}
                >
                  <Feather
                    name={ic as any}
                    size={20}
                    color={isSelected ? selectedColor : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nút lưu */}
        <PrimaryButton
          title={isEditing ? 'Lưu thay đổi' : 'Tạo thói quen'}
          loading={loading}
          onPress={handleSave}
          style={{ marginTop: 16 }}
        />
      </View>

      {/* BottomSheet: Hướng dẫn chọn danh mục & đặt mục tiêu */}
      <BottomSheet
        visible={showGoalGuide}
        onClose={() => setShowGoalGuide(false)}
        title="💡 Hướng dẫn chọn danh mục & mục tiêu"
      >
        <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.guideIntroText}>
            Mỗi thói quen có cách đo lường riêng. Chọn đúng loại mục tiêu và danh mục sẽ giúp bạn theo dõi chính xác và duy trì bền bỉ hơn!
          </Text>

          {/* PHẦN 1: GIẢI THÍCH 3 LOẠI MỤC TIÊU */}
          <Text style={styles.guideSectionTitle}>1. Ba loại mục tiêu thói quen:</Text>

          <View style={styles.guideGoalTypeCard}>
            <View style={styles.guideGoalTypeHeader}>
              <View style={[styles.guideGoalBadge, { backgroundColor: '#E0E7FF' }]}>
                <Feather name="check" size={14} color={colors.primary} />
              </View>
              <Text style={styles.guideGoalTypeName}>Check hoàn thành</Text>
            </View>
            <Text style={styles.guideGoalTypeDesc}>
              Dành cho thói quen dạng Đã làm / Chưa làm (1 lần mỗi ngày). Chỉ cần 1 chạm để hoàn thành.
            </Text>
            <Text style={styles.guideGoalTypeExample}>
              • Ví dụ: Uống vitamin, ăn sáng, đi ngủ trước 23h, dọn dẹp phòng làm việc.
            </Text>
          </View>

          <View style={styles.guideGoalTypeCard}>
            <View style={styles.guideGoalTypeHeader}>
              <View style={[styles.guideGoalBadge, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="hash" size={14} color="#D97706" />
              </View>
              <Text style={styles.guideGoalTypeName}>Đếm số lượng</Text>
            </View>
            <Text style={styles.guideGoalTypeDesc}>
              Dành cho thói quen cần đo lường bằng con số cụ thể theo đơn vị tính riêng.
            </Text>
            <Text style={styles.guideGoalTypeExample}>
              • Ví dụ: Sức khỏe (uống 8 ly nước, 6000 bước), Học tập (10 trang sách, 15 từ vựng), Công việc (5 task).
            </Text>
          </View>

          <View style={styles.guideGoalTypeCard}>
            <View style={styles.guideGoalTypeHeader}>
              <View style={[styles.guideGoalBadge, { backgroundColor: '#DCFCE7' }]}>
                <Feather name="clock" size={14} color="#16A34A" />
              </View>
              <Text style={styles.guideGoalTypeName}>Thời lượng (phút)</Text>
            </View>
            <Text style={styles.guideGoalTypeDesc}>
              Dành cho thói quen cần duy trì tập trung hoặc vận động liên tục theo số phút.
            </Text>
            <Text style={styles.guideGoalTypeExample}>
              • Ví dụ: Chạy bộ 30 phút, thiền 10 phút, ngủ trưa 20 phút, học tập 45 phút.
            </Text>
          </View>

          {/* PHẦN 2: BẢNG GỢI Ý CHI TIẾT THEO TỪNG DANH MỤC */}
          <Text style={[styles.guideSectionTitle, { marginTop: 18 }]}>
            2. Gợi ý theo từng danh mục:
          </Text>

          {Object.entries(CATEGORY_GOAL_CONFIG).map(([code, info]) => {
            const isCurrentCat = categoryCode === code;
            const catColor = mockCategories.find((c) => c.code === code)?.color || colors.primary;
            return (
              <View
                key={code}
                style={[
                  styles.guideCatCard,
                  isCurrentCat && { borderColor: catColor, borderWidth: 1.5, backgroundColor: `${catColor}08` },
                ]}
              >
                <View style={styles.guideCatTitleRow}>
                  <View style={[styles.guideCatDot, { backgroundColor: catColor }]} />
                  <Text style={[styles.guideCatName, { color: catColor }]}>
                    {info.name} {isCurrentCat ? '(Đang chọn)' : ''}
                  </Text>
                </View>
                <Text style={styles.guideCatTip}>{info.tip}</Text>

                <View style={styles.guideCatExamples}>
                  <Text style={styles.guideCatExampleItem}>
                    <Text style={{ fontWeight: '700' }}>✓ Check: </Text>{info.checkExample}
                  </Text>
                  <Text style={styles.guideCatExampleItem}>
                    <Text style={{ fontWeight: '700' }}># Đếm: </Text>{info.countExample} (Đơn vị gợi ý: {info.suggestedUnits.join(', ')})
                  </Text>
                  <Text style={styles.guideCatExampleItem}>
                    <Text style={{ fontWeight: '700' }}>⏱ Thời lượng: </Text>{info.durationExample}
                  </Text>
                </View>

                {!isCurrentCat && (
                  <TouchableOpacity
                    onPress={() => {
                      handleSelectCategory(code, catColor);
                      setShowGoalGuide(false);
                    }}
                    style={[styles.applyCatBtn, { borderColor: catColor }]}
                  >
                    <Text style={[styles.applyCatBtnText, { color: catColor }]}>
                      Chọn danh mục {info.name} này
                    </Text>
                    <Feather name="arrow-right" size={13} color={catColor} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <PrimaryButton
            title="Đã hiểu, đóng hướng dẫn"
            onPress={() => setShowGoalGuide(false)}
            style={{ marginTop: 16, marginBottom: 20 }}
          />
        </ScrollView>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
    ...shadows.card,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  fieldSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: -4,
    marginBottom: 4,
  },
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  catText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  freqOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  freqOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  freqOptionText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  freqOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysPickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayPickCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPickCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPickText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayPickTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  slotItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  slotItemText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slotItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  goalTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  goalTypeBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  goalTypeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  goalTypeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    ...shadows.card,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOptionBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTextInline: {
    color: colors.missed,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  slotHintCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: radii.button,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  slotHintTitle: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  slotHintDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickTimeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimeChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickTimeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickTimeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickFixBox: {
    marginTop: 4,
    marginBottom: 8,
  },
  quickFixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignSelf: 'flex-start',
  },
  quickFixBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  reminderAdvanceCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: radii.button,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  subFieldLabel: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subFieldHint: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  leadChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  leadChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: radii.button,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  leadChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  leadChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  leadChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  repeatChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  repeatChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  repeatChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  repeatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  repeatChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  goalTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  guideBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  guideBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  unitSuggestionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.button,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  unitSuggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  unitChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  guideIntroText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  guideSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  guideGoalTypeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.button,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  guideGoalTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guideGoalBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideGoalTypeName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideGoalTypeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  guideGoalTypeExample: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 17,
  },
  guideCatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.button,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  guideCatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guideCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  guideCatName: {
    fontSize: 13,
    fontWeight: '700',
  },
  guideCatTip: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  guideCatExamples: {
    gap: 4,
  },
  guideCatExampleItem: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  applyCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  applyCatBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
