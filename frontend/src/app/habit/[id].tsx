import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  StatCard,
  BottomSheet,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { calculateHabitStreak, getCurrentWeekDays, formatDate } from '../../utils/date';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, updateHabit, deleteHabit } = useHabits();
  const { logs } = useLogs();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);

  const habit = habits.find((h) => h._id === id || h.id === id);

  if (!habit) {
    return (
      <ScreenContainer>
        <AppHeader title="Chi tiết thói quen" showBack onBackPress={() => router.back()} />
        <View style={styles.notFoundContainer}>
          <Feather name="alert-circle" size={48} color={colors.textMuted} />
          <Text style={styles.notFoundTitle}>Không tìm thấy thói quen</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const currentStreak = calculateHabitStreak(habit._id, logs);
  const weekDays = getCurrentWeekDays();

  // Dải 7 chấm tuần này
  const weekProgress = weekDays.map((d) =>
    logs.some((l) => l.habitId === habit._id && l.date === d && l.status === 'done')
  );

  // Lịch sử 7 ngày gần nhất của thói quen
  const recentLogs = logs
    .filter((l) => l.habitId === habit._id)
    .slice(-7)
    .reverse();

  const handleToggleArchive = async () => {
    setArchiveModalVisible(false);
    const newStatus = habit.status === 'active' ? 'archived' : 'active';
    await updateHabit({ id: habit._id, updates: { status: newStatus } });
    Alert.alert('Thành công', newStatus === 'archived' ? 'Đã lưu trữ thói quen' : 'Đã khôi phục thói quen');
    router.back();
  };

  const handleDelete = async () => {
    setDeleteModalVisible(false);
    await deleteHabit(habit._id);
    Alert.alert('Đã xoá', 'Thói quen đã được xoá thành công');
    router.back();
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Chi tiết thói quen"
        showBack
        onBackPress={() => router.back()}
        rightIcon="edit-3"
        onRightPress={() => router.push({ pathname: '/habit/form' as any, params: { id: habit._id } })}
      />

      {/* Card thông tin cơ bản */}
      <View style={styles.headerCard}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: `${habit.color || colors.primary}1A` }]}>
            <Feather
              name={(habit.icon as any) || 'activity'}
              size={30}
              color={habit.color || colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.title}>{habit.title}</Text>
            <Text style={styles.subtitle}>
              {habit.frequency === 'daily' ? 'Mỗi ngày' : 'Hàng tuần'} · {habit.reminderTime}
            </Text>
          </View>
        </View>

        {Boolean(habit.description) && (
          <Text style={styles.descriptionText}>{habit.description}</Text>
        )}
      </View>

      {/* 2 StatCards: Streak hiện tại + Kỷ lục */}
      <View style={styles.statsRow}>
        <StatCard
          label="Streak hiện tại"
          value={`🔥 ${currentStreak} ngày`}
          color={colors.warning}
        />
        <StatCard
          label="Mục tiêu"
          value={`${habit.targetValue} ${habit.unit || 'lần'}`}
          color={colors.primary}
        />
      </View>

      {/* Dải tiến độ tuần này */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Tiến độ tuần này</Text>
        <View style={styles.weekDotsRow}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayName, idx) => {
            const isDone = weekProgress[idx];
            return (
              <View key={idx} style={styles.weekDayCol}>
                <View
                  style={[
                    styles.weekDayDot,
                    isDone ? styles.weekDayDotDone : styles.weekDayDotEmpty,
                  ]}
                >
                  <Feather
                    name={isDone ? 'check' : 'minus'}
                    size={14}
                    color={isDone ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <Text style={styles.weekDayName}>{dayName}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Lịch sử check-in gần đây */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Lịch sử check-in gần đây</Text>
        <View style={{ marginTop: 8 }}>
          {recentLogs.length === 0 ? (
            <Text style={styles.noHistoryText}>Chưa có lịch sử ghi nhận</Text>
          ) : (
            recentLogs.map((log) => (
              <View key={log._id} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyStatusDot,
                      { backgroundColor: log.status === 'done' ? colors.success : '#EF4444' },
                    ]}
                  />
                  <Text style={styles.historyDate}>{log.date}</Text>
                </View>
                <Text
                  style={[
                    styles.historyStatusText,
                    { color: log.status === 'done' ? colors.success : '#EF4444' },
                  ]}
                >
                  {log.status === 'done' ? 'Hoàn thành ✓' : 'Bỏ lỡ ✗'}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Nhóm nút hành động: Sửa / Lưu trữ / Xoá */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionOutlineBtn}
          onPress={() => router.push({ pathname: '/habit/form' as any, params: { id: habit._id } })}
        >
          <Feather name="edit-2" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.actionOutlineText}>Chỉnh sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionOutlineBtn}
          onPress={() => setArchiveModalVisible(true)}
        >
          <Feather name="archive" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.actionOutlineText}>
            {habit.status === 'active' ? 'Lưu trữ' : 'Bỏ lưu trữ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionDeleteBtn}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Feather name="trash-2" size={16} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.actionDeleteText}>Xoá</Text>
        </TouchableOpacity>
      </View>

      {/* Modal xác nhận xoá */}
      <BottomSheet
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Xác nhận xoá thói quen"
      >
        <View style={{ gap: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSizes.body, color: colors.textSecondary, textAlign: 'center' }}>
            Bạn có chắc chắn muốn xoá vĩnh viễn thói quen "{habit.title}" không? Hành động này không thể hoàn tác.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.modalCancelText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmDeleteBtn} onPress={handleDelete}>
              <Text style={styles.modalConfirmDeleteText}>Xoá vĩnh viễn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Modal xác nhận lưu trữ */}
      <BottomSheet
        visible={archiveModalVisible}
        onClose={() => setArchiveModalVisible(false)}
        title="Xác nhận lưu trữ"
      >
        <View style={{ gap: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSizes.body, color: colors.textSecondary, textAlign: 'center' }}>
            {habit.status === 'active'
              ? 'Thói quen sẽ được đưa vào mục Lưu trữ và tạm dừng nhắc nhở.'
              : 'Thói quen sẽ được kích hoạt lại và tiếp tục theo dõi hàng ngày.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setArchiveModalVisible(false)}>
              <Text style={styles.modalCancelText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmArchiveBtn} onPress={handleToggleArchive}>
              <Text style={styles.modalConfirmArchiveText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  notFoundTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionCardTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayDotDone: {
    backgroundColor: colors.success,
  },
  weekDayDotEmpty: {
    backgroundColor: colors.borderLight,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noHistoryText: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  historyDate: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  historyStatusText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 32,
  },
  actionOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: radii.button,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionOutlineText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: radii.button,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDeleteText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmDeleteText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalConfirmArchiveBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmArchiveText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
