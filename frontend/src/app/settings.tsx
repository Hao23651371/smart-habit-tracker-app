import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  BottomSheet,
  TextField,
  PrimaryButton,
} from '../components';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { useAppDispatch } from '../store/store';
import { logout } from '../store/authSlice';
import { authApi } from '../api/authApi';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [defaultReminderTime, setDefaultReminderTime] = useState('08:00');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  // Đổi mật khẩu BottomSheet
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setChangePasswordVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công');
  };

  const handleLogout = async () => {
    await authApi.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Cài đặt"
        showBack
        onBackPress={() => router.back()}
      />

      {/* Nhóm Thông báo */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Thông báo & Nhắc nhở</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Bật thông báo đẩy</Text>
            <Text style={styles.rowSubtitle}>Nhận thông báo nhắc nhở khi đến giờ thói quen</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Giờ nhắc nhở mặc định</Text>
            <Text style={styles.rowSubtitle}>Áp dụng khi tạo thói quen mới</Text>
          </View>
          <View style={styles.timeTag}>
            <Text style={styles.timeTagText}>{defaultReminderTime}</Text>
          </View>
        </View>
      </View>

      {/* Nhóm Giao diện & Ngôn ngữ */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Giao diện & Hệ thống</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Chế độ tối (Dark mode)</Text>
            <Text style={styles.rowSubtitle}>Giao diện tối giúp bảo vệ mắt vào ban đêm</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Ngôn ngữ</Text>
            <Text style={styles.rowSubtitle}>Ngôn ngữ hiển thị trên ứng dụng</Text>
          </View>
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          >
            <Text style={styles.langPillText}>
              {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nhóm Tài khoản & Bảo mật */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tài khoản & Bảo mật</Text>

        <TouchableOpacity
          style={styles.rowClickable}
          onPress={() => setChangePasswordVisible(true)}
        >
          <Text style={styles.rowTitle}>Đổi mật khẩu</Text>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowClickable, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
        >
          <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Đăng xuất khỏi tài khoản</Text>
          <Feather name="log-out" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Thông tin phiên bản */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Smart Habit Tracker v1.0.0 (Build 2026)</Text>
      </View>

      {/* BottomSheet Đổi mật khẩu */}
      <BottomSheet
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
        title="Đổi mật khẩu"
      >
        <View style={{ gap: 12, paddingVertical: 6 }}>
          <TextField
            label="Mật khẩu hiện tại"
            isPassword
            leftIcon="lock"
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TextField
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
            isPassword
            leftIcon="lock"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            isPassword
            leftIcon="check-circle"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          <PrimaryButton
            title="Xác nhận đổi mật khẩu"
            onPress={handleChangePassword}
            style={{ marginTop: 8 }}
          />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowTitle: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  timeTagText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  langPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  langPillText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  versionText: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
});
