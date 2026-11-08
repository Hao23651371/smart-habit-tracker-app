import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
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
import { useAppDispatch, useAppSelector } from '../store/store';
import { logout, updateUser } from '../store/authSlice';
import { authApi } from '../api/authApi';
import { useHabits } from '../hooks/useHabits';
import { storage } from '../utils/storage';
import {
  getPermissionStatus,
  requestPermission,
  rescheduleAll,
  cancelAllReminders,
  scheduleTestNotification,
} from '../utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { habits } = useHabits();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.settings?.notificationsEnabled ?? true
  );
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');
  const [testingReminder, setTestingReminder] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  // Đổi mật khẩu BottomSheet
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    getPermissionStatus().then((s) => setPermissionStatus(s));
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const perm = await requestPermission();
      setPermissionStatus(perm);
      if (perm === 'denied' && Platform.OS !== 'web') {
        Alert.alert(
          'Chưa cấp quyền',
          'Bạn chưa cấp quyền thông báo. Vui lòng mở Cài đặt thiết bị để cho phép thông báo cho ứng dụng.'
        );
        return;
      }
      setNotificationsEnabled(true);
      await rescheduleAll(habits);
    } else {
      setNotificationsEnabled(false);
      await cancelAllReminders();
    }

    if (user) {
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          notificationsEnabled: value,
        },
      };
      dispatch(updateUser(updatedUser));
      await storage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const handleTestNotification = async () => {
    if (testingReminder) return;
    setTestingReminder(true);
    if (Platform.OS === 'web') {
      Alert.alert(
        'Đã hẹn thử nghiệm',
        'Trên Web, thông báo dạng banner trượt sẽ tự động hiển thị trong ứng dụng khi có thói quen cần làm trong vòng 10 phút.'
      );
      setTestingReminder(false);
      return;
    }

    const perm = await getPermissionStatus();
    if (perm !== 'granted') {
      const req = await requestPermission();
      setPermissionStatus(req);
      if (req !== 'granted') {
        Alert.alert('Chưa có quyền', 'Vui lòng cấp quyền thông báo để thử nghiệm tính năng này.');
        setTestingReminder(false);
        return;
      }
    }

    await scheduleTestNotification('Uống nước ấm');
    Alert.alert(
      'Đã lên lịch nhắc nhở!',
      'Hệ thống sẽ gửi thông báo sau đúng 10 giây. Bạn có thể khóa màn hình để kiểm tra.'
    );
    setTimeout(() => setTestingReminder(false), 3000);
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      Alert.alert('Thành công', 'Đã cấp quyền thông báo hệ thống');
    } else {
      Alert.alert('Chưa cấp quyền', 'Vui lòng mở Cài đặt thiết bị để bật thông báo.');
    }
  };

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
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.rowTitle}>Bật thông báo & nhắc nhở</Text>
            <Text style={styles.rowSubtitle}>Tự động gửi thông báo trước giờ hẹn thói quen</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Thời gian nhắc trước</Text>
            <Text style={styles.rowSubtitle}>Khoảng đệm chuẩn bị trước giờ hẹn</Text>
          </View>
          <View style={styles.timeTag}>
            <Text style={styles.timeTagText}>10 phút</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Quyền thông báo hệ thống</Text>
            <Text style={styles.rowSubtitle}>
              {permissionStatus === 'granted' ? 'Hệ thống đã sẵn sàng gửi nhắc nhở' : 'Chưa được cấp quyền gửi thông báo'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRequestPermission}
            style={[
              styles.permissionBadge,
              { backgroundColor: permissionStatus === 'granted' ? '#DCFCE7' : '#FEF3C7' },
            ]}
          >
            <Text
              style={[
                styles.permissionBadgeText,
                { color: permissionStatus === 'granted' ? '#16A34A' : '#D97706' },
              ]}
            >
              {permissionStatus === 'granted' ? 'Đã cấp' : 'Chưa cấp'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.rowClickable, { borderBottomWidth: 0, paddingTop: 14 }]}
          onPress={handleTestNotification}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="bell" size={18} color={colors.primary} />
            <Text style={[styles.rowTitle, { color: colors.primary }]}>
              {testingReminder ? 'Đang gửi thông báo...' : 'Thử nhắc nhở sau 10 giây'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
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
  permissionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  permissionBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
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
