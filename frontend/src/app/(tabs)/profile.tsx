import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
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
import { mockUser } from '../../mock/users';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats } = useStats();
  const { achievements, userAchievements } = useAchievements();

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || user?.fullName || '');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const currentUser = user || mockUser;
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
            icon="flame"
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

      {/* 3. Thẻ Thành tích (4 huy hiệu gần nhất + Xem tất cả) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="award" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionCardTitle}>Thành tích đã đạt</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/achievements' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllLink}>Xem tất cả ({userAchievements.length}/11)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentBadgesRow}>
          {recentAchievements.map((ach) => {
            const isUnlocked = unlockedIds.has(ach._id);
            return (
              <View key={ach._id} style={styles.badgeMiniCol}>
                <View
                  style={[
                    styles.badgeMiniCircle,
                    isUnlocked ? styles.badgeMiniUnlocked : styles.badgeMiniLocked,
                  ]}
                >
                  <Feather
                    name={isUnlocked ? (ach.icon as any) || 'award' : 'lock'}
                    size={18}
                    color={isUnlocked ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <Text style={styles.badgeMiniName} numberOfLines={1}>
                  {ach.name}
                </Text>
              </View>
            );
          })}
        </View>
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
});
