import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  StatCard,
  BottomSheet,
  TextField,
  PrimaryButton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout, updateUser } from '../../store/authSlice';
import { authApi } from '../../api/authApi';
import { useStats } from '../../hooks/useStats';
import { useAchievements } from '../../hooks/useAchievements';
const fallbackUser = {
  _id: 'usr_default',
  name: 'An Nguyễn',
  fullName: 'An Nguyễn',
  email: 'an.nguyen@example.com',
  avatarUrl: undefined as string | undefined,
  avatar: undefined as string | undefined,
  onboarding: {
    completed: true,
    goals: ['Rèn luyện sức khỏe', 'Đọc sách mỗi ngày'],
    level: 'moderate' as const,
    reminderSlots: ['morning', 'evening'],
  },
  settings: {
    notificationsEnabled: true,
    theme: 'light' as const,
    language: 'vi' as const,
  },
  createdAt: new Date().toISOString(),
};

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats } = useStats();
  const { achievements, userAchievements, isUnlocked, getProgress } = useAchievements();

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || user?.fullName || '');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showAchievementBoard, setShowAchievementBoard] = useState(false);

  // Theo dõi uống nước mỗi ngày
  const [waterIntake, setWaterIntake] = useState<number>(1250); // ml
  const WATER_GOAL = 2000;
  const waterPercent = Math.min(100, Math.round((waterIntake / WATER_GOAL) * 100));

  const handleAddWater = (amount: number) => {
    setWaterIntake((prev) => {
      const next = prev + amount;
      if (next >= WATER_GOAL && prev < WATER_GOAL) {
        Alert.alert('Chúc mừng! 🌊', 'Bạn đã hoàn thành mục tiêu 2,000ml nước hôm nay!');
      }
      return next;
    });
  };

  const handleResetWater = () => {
    setWaterIntake(0);
  };

  const currentUser = user || fallbackUser;
  const displayName = currentUser.name || currentUser.fullName || 'Nguyễn Minh An';

  // 4 huy hiệu gần nhất
  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const recentAchievements = achievements.slice(0, 4);

  const handleSaveProfile = () => {
    if (!editedName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    dispatch(updateUser({ name: editedName.trim(), fullName: editedName.trim() }));
    setEditProfileVisible(false);
    Alert.alert('Thành công', 'Đã cập nhật tên hồ sơ');
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await authApi.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer>
      <AppHeader title="Hồ sơ cá nhân" />

      {/* 1. Avatar tròn, họ tên, email, ngày tham gia */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          {currentUser.avatarUrl ? (
            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{currentUser.email}</Text>
            <Text style={styles.joinDateText}>Tham gia từ 01/10/2026</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => {
            setEditedName(displayName);
            setEditProfileVisible(true);
          }}
        >
          <Feather name="edit-2" size={14} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Lưới 4 StatCard */}
      <View style={styles.statsGrid}>
        <View style={styles.statsGridRow}>
          <StatCard
            label="Tổng thói quen"
            value={stats?.totalHabits ?? 0}
            icon="list"
            color={colors.primary}
          />
          <StatCard
            label="Lần hoàn thành"
            value={stats?.totalCompleted ?? 0}
            icon="check-circle"
            color={colors.success}
          />
        </View>
        <View style={styles.statsGridRow}>
          <StatCard
            label="Streak kỷ lục"
            value={`🔥 ${stats?.longestStreak ?? 0}`}
            icon="zap"
            color={colors.warning}
          />
          <StatCard
            label="Tỉ lệ duy trì"
            value={`${stats?.completionRate ?? 0}%`}
            icon="pie-chart"
            color="#8B5CF6"
          />
        </View>
      </View>

      {/* 2.5. Thẻ Theo dõi Nước & Chuỗi Thủy Thần */}
      <View style={styles.waterCard}>
        <View style={styles.waterHeaderRow}>
          <View style={styles.waterTitleWrap}>
            <View style={styles.waterIconBadge}>
              <Feather name="droplet" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.waterTitle}>Uống đủ nước mỗi ngày</Text>
              <Text style={styles.waterSubtitle}>Mục tiêu: 2,000 ml • Thanh lọc & tỉnh táo</Text>
            </View>
          </View>
          <View style={styles.waterStreakPill}>
            <Text style={styles.waterStreakPillText}>🌊 Thủy thần</Text>
          </View>
        </View>

        {/* Thanh tiến độ nước */}
        <View style={styles.waterProgressSection}>
          <View style={styles.waterProgressLabelRow}>
            <Text style={styles.waterIntakeValue}>
              {waterIntake.toLocaleString()} <Text style={styles.waterUnit}>/ {WATER_GOAL.toLocaleString()} ml</Text>
            </Text>
            <Text style={styles.waterPercentText}>{waterPercent}%</Text>
          </View>
          <View style={styles.waterBarTrack}>
            <View style={[styles.waterBarFill, { width: `${waterPercent}%` }]} />
          </View>
        </View>

        {/* Nút bấm thêm nhanh nước */}
        <View style={styles.waterActionsRow}>
          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => handleAddWater(250)}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={14} color="#0284C7" />
            <Text style={styles.waterBtnText}>+250ml (1 ly)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => handleAddWater(500)}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={14} color="#0284C7" />
            <Text style={styles.waterBtnText}>+500ml (1 chai)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waterResetBtn}
            onPress={handleResetWater}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Thẻ Thành tích (Huy hiệu gần nhất + Xem tất cả) */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionCardHeader}
          onPress={() => router.push('/achievements' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Feather name="award" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionCardTitle}>Thành tích đã đạt</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.viewAllLink}>
              Xem tất cả ({userAchievements.length}/{achievements.length})
            </Text>
            <Feather name="chevron-right" size={16} color={colors.primary} style={{ marginLeft: 2 }} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recentBadgesRow}
          onPress={() => setShowAchievementBoard(true)}
          activeOpacity={0.8}
        >
          {recentAchievements.map((ach) => {
            const isAchUnlocked = isUnlocked(ach._id);
            return (
              <View key={ach._id} style={styles.badgeMiniCol}>
                <View
                  style={[
                    styles.badgeMiniCircle,
                    isAchUnlocked ? styles.badgeMiniUnlocked : styles.badgeMiniLocked,
                  ]}
                >
                  <Feather
                    name={isAchUnlocked ? (ach.icon as any) || 'award' : 'lock'}
                    size={18}
                    color={isAchUnlocked ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <Text style={styles.badgeMiniName} numberOfLines={1}>
                  {ach.name}
                </Text>
              </View>
            );
          })}
        </TouchableOpacity>
      </View>

      {/* 4. Mục tiêu của tôi (chip lấy từ onboarding.goals) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Feather name="target" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionCardTitle}>Mục tiêu của tôi</Text>
        </View>
        <View style={styles.goalsWrap}>
          {currentUser.onboarding?.goals?.map((goal, idx) => (
            <View key={idx} style={styles.goalChip}>
              <Feather name="check" size={12} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.goalChipText}>{goal}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Menu tuỳ chọn */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings' as any)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
            <Feather name="settings" size={18} color={colors.primary} />
          </View>
          <Text style={styles.menuItemText}>Cài đặt ứng dụng</Text>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Trợ giúp', 'Liên hệ hỗ trợ: support@smarthabit.app')}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="help-circle" size={18} color="#D97706" />
          </View>
          <Text style={styles.menuItemText}>Trợ giúp & Phản hồi</Text>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => setLogoutModalVisible(true)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="log-out" size={18} color="#EF4444" />
          </View>
          <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Đăng xuất</Text>
          <Feather name="chevron-right" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* BottomSheet Chỉnh sửa tên */}
      <BottomSheet
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        title="Chỉnh sửa hồ sơ"
      >
        <View style={{ gap: 12, paddingVertical: 6 }}>
          <TextField
            label="Họ và tên"
            value={editedName}
            onChangeText={setEditedName}
            leftIcon="user"
          />
          <PrimaryButton
            title="Lưu thay đổi"
            onPress={handleSaveProfile}
            style={{ marginTop: 8 }}
          />
        </View>
      </BottomSheet>

      {/* BottomSheet Xác nhận Đăng xuất */}
      <BottomSheet
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Xác nhận đăng xuất"
      >
        <View style={{ gap: 14, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSizes.body, color: colors.textSecondary, textAlign: 'center' }}>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản trên thiết bị này không?
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
            <TouchableOpacity
              style={styles.cancelLogoutBtn}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.cancelLogoutText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmLogoutBtn}
              onPress={handleConfirmLogout}
            >
              <Text style={styles.confirmLogoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
      {/* BottomSheet: Bảng thành tích & Hướng dẫn ràng buộc Streak */}
      <BottomSheet
        visible={showAchievementBoard}
        onClose={() => setShowAchievementBoard(false)}
        title="🏆 Bảng thành tích của bạn"
      >
        <ScrollView style={{ maxHeight: 490 }} showsVerticalScrollIndicator={false}>
          {/* Card tóm tắt tiến độ */}
          <View style={styles.achModalSummaryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.achModalSummaryTitle}>
                Đã mở khoá {userAchievements.length}/{achievements.length} huy hiệu
              </Text>
              <Text style={styles.achModalSummarySub}>
                {Math.round((userAchievements.length / (achievements.length || 1)) * 100)}% toàn bộ chặng đường
              </Text>
            </View>
            <View style={styles.achModalFireBox}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={styles.achModalFireNum}>
                {stats?.longestStreak ?? 0}
              </Text>
              <Text style={styles.achModalFireLabel}>Streak kỷ lục</Text>
            </View>
          </View>

          {/* Banner hướng dẫn ràng buộc Streak & Thành tích nước */}
          <View style={styles.achRuleBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Feather name="info" size={14} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.achRuleTitle}>Quy tắc Streak & Điều kiện mở khoá:</Text>
            </View>
            <Text style={styles.achRuleDesc}>
              • <Text style={{ fontWeight: '700' }}>Ràng buộc Streak:</Text> Dưới 3 ngày liên tiếp (1, 2) chưa tính streak. Bạn cần đạt từ ngày thứ 3 liên tục trở lên để kích hoạt ngọn lửa Streak 🔥.
            </Text>
            <Text style={styles.achRuleDesc}>
              • <Text style={{ fontWeight: '700' }}>Huy hiệu Nước & Chuỗi 12 ngày:</Text> Duy trì chuỗi từ 10 - 12 ngày liên tục thực hiện thói quen uống nước ấm / học bài để mở khoá huy hiệu "Kiện tướng uống nước" và "Chuỗi vàng 12 ngày"!
            </Text>
          </View>

          {/* Danh sách toàn bộ huy hiệu */}
          <View style={{ gap: 10, marginTop: 8 }}>
            {achievements.map((ach) => {
              const { current, target, percent, isUnlocked: achUnlocked } = getProgress(ach);
              return (
                <View
                  key={ach._id}
                  style={[
                    styles.achItemCard,
                    achUnlocked ? styles.achItemUnlocked : styles.achItemLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.achItemIconBox,
                      achUnlocked ? styles.achItemIconUnlocked : styles.achItemIconLocked,
                    ]}
                  >
                    <Feather
                      name={achUnlocked ? (ach.icon as any) || 'award' : 'lock'}
                      size={20}
                      color={achUnlocked ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.achItemName, achUnlocked && { color: colors.textPrimary }]}>
                        {ach.name}
                      </Text>
                      {achUnlocked ? (
                        <View style={styles.achDoneBadge}>
                          <Feather name="check" size={11} color="#16A34A" />
                          <Text style={styles.achDoneBadgeText}>Đã mở</Text>
                        </View>
                      ) : (
                        <Text style={styles.achProgressText}>
                          {current}/{target}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.achItemDesc}>{ach.description}</Text>

                    {!achUnlocked && (
                      <View style={styles.achBarBg}>
                        <View style={[styles.achBarFill, { width: `${percent}%` }]} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.achFullPageBtn}
              onPress={() => {
                setShowAchievementBoard(false);
                router.push('/achievements' as any);
              }}
            >
              <Feather name="external-link" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.achFullPageText}>Xem trang chi tiết</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.achCloseBtn}
              onPress={() => setShowAchievementBoard(false)}
            >
              <Text style={styles.achCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joinDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: radii.button,
  },
  editProfileText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statsGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  waterCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    ...shadows.card,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  waterTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  waterIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  waterSubtitle: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
  },
  waterStreakPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  waterStreakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  waterProgressSection: {
    marginBottom: 12,
  },
  waterProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  waterIntakeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
  },
  waterUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0284C7',
  },
  waterPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  waterBarTrack: {
    height: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  waterActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  waterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 8,
    borderRadius: radii.button,
    gap: 4,
  },
  waterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  waterResetBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.button,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCardTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllLink: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  recentBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeMiniCol: {
    alignItems: 'center',
    width: '22%',
  },
  badgeMiniCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeMiniUnlocked: {
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  badgeMiniLocked: {
    backgroundColor: '#EBE9F5',
  },
  badgeMiniName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalChipText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  cancelLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelLogoutText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  achModalSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: radii.button,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 12,
  },
  achModalSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  achModalSummarySub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  achModalFireBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  achModalFireNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  achModalFireLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  achRuleBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: radii.button,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  achRuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  achRuleDesc: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginTop: 2,
  },
  achItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  achItemUnlocked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C7D2FE',
  },
  achItemLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.85,
  },
  achItemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achItemIconUnlocked: {
    backgroundColor: colors.primary,
  },
  achItemIconLocked: {
    backgroundColor: '#E5E7EB',
  },
  achItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    flex: 1,
  },
  achDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    gap: 3,
  },
  achDoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  achProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  achItemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  achBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  achBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  achFullPageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  achFullPageText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  achCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
