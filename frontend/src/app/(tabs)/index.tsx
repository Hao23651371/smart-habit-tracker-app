import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout } from '../../store/authSlice';
import { authApi } from '../../api/authApi';
import { getGreeting, getVietnameseDateText } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await authApi.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const displayName = user?.name || user?.fullName || 'Người dùng';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.greeting}>{getGreeting(displayName.split(' ').pop())}</Text>
            <Text style={styles.date}>{getVietnameseDateText()}</Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="log-out" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Thông báo đăng nhập thành công */}
        <View style={styles.authSuccessCard}>
          <Feather name="check-circle" size={20} color={colors.success} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authSuccessTitle}>Đăng nhập thành công! (GĐ2 Hoàn tất)</Text>
            <Text style={styles.authSuccessDesc}>
              Token đã được lưu trong Storage an toàn và quản lý qua Redux Toolkit.
            </Text>
          </View>
        </View>

        {/* Thông tin tài khoản */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin phiên đăng nhập</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên:</Text>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mục tiêu đã chọn:</Text>
            <Text style={styles.infoValue}>
              {user?.onboarding?.goals?.join(', ') || 'Chưa cập nhật'}
            </Text>
          </View>
        </View>

        {/* Nút Đăng xuất lớn */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.fullLogoutBtn}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.fullLogoutBtnText}>Đăng xuất khỏi ứng dụng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  greeting: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authSuccessCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 20,
  },
  authSuccessTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  authSuccessDesc: {
    fontSize: fontSizes.caption,
    color: '#166534',
  },
  infoSection: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  fullLogoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: radii.button,
    height: 50,
  },
  fullLogoutBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.subhead,
    fontWeight: '700',
  },
});
