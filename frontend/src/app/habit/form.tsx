import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  TextField,
  PrimaryButton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { mockCategories } from '../../mock/categories';
import { Habit, HabitFrequency, HabitGoalType, HabitTimeSlot } from '../../types';
import {
  requestPermission,
  scheduleHabitReminders,
  cancelHabitReminders,
} from '../../utils/notifications';

const COLOR_OPTIONS = ['#22C55E', '#7C5CFC', '#6366F1', '#F59E0B', '#0EA5E9', '#EC4899', '#14B8A6'];
const ICON_OPTIONS = ['activity', 'book-open', 'droplet', 'moon', 'sun', 'zap', 'coffee', 'heart'];

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
  const [unit, setUnit] = useState<string>(existingHabit?.unit || 'lần');
  const [selectedColor, setSelectedColor] = useState<string>(
    existingHabit?.color || '#7C5CFC'
  );
  const [selectedIcon, setSelectedIcon] = useState<string>(
    existingHabit?.icon || 'activity'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<string>('');

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayNum));
      }
    } else {
      setSelectedDays([...selectedDays, dayNum].sort());
    }
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
    if (!title.trim()) {
      setTitleError('Vui lòng nhập tên thói quen');
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
        timeSlot,
        goalType,
        targetValue: parseInt(targetValue, 10) || 1,
        unit,
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
      Alert.alert('Thành công', isEditing ? 'Đã cập nhật thói quen' : 'Đã tạo thói quen mới');
      router.back();
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
            if (titleError) setTitleError('');
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
                  onPress={() => {
                    setCategoryCode(cat.code);
                    setSelectedColor(cat.color);
                  }}
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
                  onPress={() => setTimeSlot(slot.id as HabitTimeSlot)}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                >
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bật/Tắt nhắc nhở */}
        <View style={styles.reminderToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Bật nhắc nhở</Text>
            <Text style={styles.fieldSubtitle}>Nhắc trước 10 phút qua thông báo</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Giờ nhắc nhở */}
        {reminderEnabled && (
          <TextField
            label="Giờ nhắc nhở (HH:mm)"
            placeholder="07:30"
            value={reminderTime}
            onChangeText={setReminderTime}
            leftIcon="clock"
          />
        )}

        {/* Loại mục tiêu */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Loại mục tiêu</Text>
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
                  onPress={() => {
                    setGoalType(gt.id as HabitGoalType);
                    if (gt.id === 'duration') setUnit('phút');
                    else if (gt.id === 'count') setUnit('trang');
                    else setUnit('lần');
                  }}
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
});
