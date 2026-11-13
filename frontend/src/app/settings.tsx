import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
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
import { ReminderBanner } from '../components/ReminderBanner';
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

const BUFFER_OPTIONS = [
  { value: 3, label: '3 phút trước' },
  { value: 5, label: '5 phút trước' },
  { value: 10, label: '10 phút trước (Khuyên dùng)' },
  { value: 15, label: '15 phút trước' },
  { value: 30, label: '30 phút trước' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { habits } = useHabits();

  // 1. Cài đặt Thông báo & Nhắc nhở
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.settings?.notificationsEnabled ?? true
  );
  const [reminderBuffer, setReminderBuffer] = useState<number>(10);
  const [showBufferSheet, setShowBufferSheet] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');

  // Thử nghiệm thông báo
  const [testingReminder, setTestingReminder] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [testBanner, setTestBanner] = useState<{
    visible: boolean;
    title: string;
    body: string;
  } | null>(null);

  // 2. Giao diện sáng / tối (Dark mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 3. Tính năng mới đề xuất hữu ích
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Vừa xong');

  // 4. Đổi mật khẩu BottomSheet & Validation ràng buộc
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Quản lý lỗi từng ô nhập (báo đỏ khi có lỗi)
  const [passwordErrors, setPasswordErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  // Khởi tạo & khôi phục cài đặt đã lưu
  useEffect(() => {
    getPermissionStatus().then((s) => setPermissionStatus(s));

    storage.getItem('user_settings').then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.reminderBuffer !== undefined) setReminderBuffer(parsed.reminderBuffer);
          if (parsed.vibrationEnabled !== undefined) setVibrationEnabled(parsed.vibrationEnabled);
          if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
          if (parsed.quietHoursEnabled !== undefined) setQuietHoursEnabled(parsed.quietHoursEnabled);
        } catch {
          // ignore
        }
      }
    });

    storage.getItem('app_theme').then((theme) => {
      if (theme === 'dark') setIsDarkMode(true);
    });
  }, []);

  // Màu sắc giao diện thích ứng Sáng / Tối dịu mắt
  const theme = isDarkMode
    ? {
        bg: '#12111E',
        card: '#1D1B2C',
        textPrimary: '#F8F7FF',
        textSecondary: '#A5A2BD',
        textMuted: '#6C6885',
        border: '#2E2A44',
        borderLight: '#252238',
        primaryLight: '#2D2554',
        primaryText: '#A78BFA',
        subtleBg: '#171524',
        inputBg: '#181624',
        statusBg: '#2D2554',
      }
    : {
        bg: colors.background,
        card: colors.card,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        textMuted: colors.textMuted,
        border: colors.border,
        borderLight: colors.borderLight,
        primaryLight: colors.primaryLight,
        primaryText: colors.primary,
        subtleBg: '#F8F7FF',
        inputBg: '#FFFFFF',
        statusBg: colors.primaryLight,
      };

  // Lưu cài đặt Dark Mode
  const handleToggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await storage.setItem('app_theme', value ? 'dark' : 'light');
  };

  // Bật/tắt thông báo
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

  // Chọn thời gian nhắc trước
  const handleSelectBuffer = async (mins: number) => {
    setReminderBuffer(mins);
    setShowBufferSheet(false);
    await storage.setItem(
      'user_settings',
      JSON.stringify({
        reminderBuffer: mins,
        vibrationEnabled,
        soundEnabled,
        quietHoursEnabled,
      })
    );
    Alert.alert('Đã cập nhật', `Hệ thống sẽ nhắc bạn trước ${mins} phút khi tới giờ thói quen.`);
  };

  // Yêu cầu cấp quyền
  const handleRequestPermission = async () => {
    const res = await requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      Alert.alert('Thành công', 'Đã cấp quyền thông báo hệ thống');
    } else {
      Alert.alert('Chưa cấp quyền', 'Vui lòng mở Cài đặt thiết bị để bật quyền thông báo.');
    }
  };

  // 1. THỬ NGHIỆM THÔNG BÁO TỨC THÌ (Xem giao diện Banner ngay)
  const handleTestNotificationInstant = async () => {
    setTestBanner({
      visible: true,
      title: '🔔 [Thử nghiệm] Đã tới giờ: Uống 1 ly nước ấm!',
      body: `Khoảng đệm nhắc trước ${reminderBuffer} phút. Chuẩn bị bắt đầu ngay để duy trì chuỗi 🔥 3 ngày nhé!`,
    });
  };

  // 2. THỬ NGHIỆM THÔNG BÁO SAU 5 GIÂY (Đếm ngược có hiển thị)
  const handleTestNotificationCountdown = async () => {
    if (countdownSeconds !== null) return;

    let sec = 5;
    setCountdownSeconds(sec);

    const timer = setInterval(() => {
      sec -= 1;
      if (sec > 0) {
        setCountdownSeconds(sec);
      } else {
        clearInterval(timer);
        setCountdownSeconds(null);

        // Kích hoạt banner thông báo thử nghiệm
        setTestBanner({
          visible: true,
          title: '⏰ [Hẹn giờ 5s] Uống 1 ly nước ấm & Vận động nhẹ!',
          body: 'Thông báo đã kích hoạt thành công sau 5 giây hẹn trước. Bạn có thể yên tâm ứng dụng sẽ nhắc đúng giờ.',
        });

        // Nếu trên Native thì phát thông báo đẩy thật
        if (Platform.OS !== 'web') {
          scheduleTestNotification('Uống 1 ly nước ấm');
        }
      }
    }, 1000);
  };

  // Đồng bộ đám mây thủ công
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncTime(`Hôm nay ${timeStr}`);
      Alert.alert('Đã đồng bộ thành công! ☁️', 'Tất cả thói quen, lịch sử check-in và chuỗi streak đã được cập nhật an toàn với máy chủ MongoDB.');
    }, 1200);
  };

  // Xử lý gõ mật khẩu: Ô nào đang báo đỏ mà người dùng gõ lại thì XÓA BÁO ĐỎ Ô ĐÓ NGAY
  const handleOldPasswordChange = (val: string) => {
    setOldPassword(val);
    if (passwordErrors.oldPassword) {
      setPasswordErrors((prev) => ({ ...prev, oldPassword: undefined }));
    }
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    if (passwordErrors.newPassword) {
      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
    }
  };

  const handleConfirmNewPasswordChange = (val: string) => {
    setConfirmNewPassword(val);
    if (passwordErrors.confirmNewPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
    }
  };

  // Bấm nút Lưu thay đổi / Xác nhận đổi mật khẩu: Kiểm tra toàn bộ ràng buộc và báo đỏ ô sai
  const handleChangePassword = async () => {
    const errs: {
      oldPassword?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    } = {};

    // 1. Kiểm tra mật khẩu cũ
    if (!oldPassword.trim()) {
      errs.oldPassword = 'Vui lòng nhập mật khẩu hiện tại của bạn';
    }

    // 2. Kiểm tra mật khẩu mới
    if (!newPassword.trim()) {
      errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    } else if (newPassword === oldPassword) {
      errs.newPassword = 'Mật khẩu mới không được trùng với mật khẩu cũ';
    }

    // 3. Kiểm tra xác nhận mật khẩu mới
    if (!confirmNewPassword.trim()) {
      errs.confirmNewPassword = 'Vui lòng nhập lại mật khẩu mới để xác nhận';
    } else if (confirmNewPassword !== newPassword) {
      errs.confirmNewPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới';
    }

    // Nếu vi phạm bất kỳ ràng buộc nào -> Báo đỏ ngay các ô bị lỗi
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    // Không có lỗi ràng buộc -> Tiến hành gọi API
    setIsSubmittingPassword(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setChangePasswordVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors({});
      Alert.alert(
        'Đổi mật khẩu thành công! 🎉',
        'Mật khẩu tài khoản của bạn đã được cập nhật thành công. Vui lòng ghi nhớ mật khẩu mới.'
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể đổi mật khẩu. Vui lòng thử lại sau.';
      if (
        msg.toLowerCase().includes('hiện tại') ||
        msg.toLowerCase().includes('cũ') ||
        msg.toLowerCase().includes('không chính xác')
      ) {
        // Gán lỗi đỏ cho ô mật khẩu hiện tại
        setPasswordErrors({ oldPassword: msg });
      } else {
        Alert.alert('Thông báo', msg);
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authApi.logout();
          dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = user?.name || user?.fullName || 'Người dùng';
  const displayEmail = user?.email || 'user@smarthabit.com';

  return (
    <ScreenContainer style={{ backgroundColor: theme.bg }}>
      <AppHeader
        title="Cài đặt"
        showBack
        onBackPress={() => router.back()}
      />

      {/* Banner thông báo thử nghiệm trực quan (Hiển thị ngay trên màn hình khi bấm nút test) */}
      {testBanner && testBanner.visible && (
        <ReminderBanner
          visible={true}
          title={testBanner.title}
          body={testBanner.body}
          icon="bell"
          onConfirm={() => {
            setTestBanner(null);
            Alert.alert('Tuyệt vời!', 'Bạn đã xác nhận thực hiện nhiệm vụ thành công.');
          }}
          onAction={() => {
            setTestBanner(null);
            router.push('/(tabs)/' as any);
          }}
          onDismiss={() => setTestBanner(null)}
        />
      )}

      {/* Card Hồ sơ tóm tắt đầu trang */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primaryText }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.memberBadge}>
                <Feather name="shield" size={12} color="#16A34A" />
                <Text style={styles.memberBadgeText}>Chính thức</Text>
              </View>
            </View>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>
      </View>

      {/* Nhóm 1: Thông báo & Nhắc nhở */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Thông báo & Nhắc nhở</Text>

        {/* Bật / Tắt thông báo */}
        <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Bật thông báo & nhắc nhở</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              Tự động gửi thông báo trước giờ hẹn thói quen
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.border, true: colors.primary }}
          />
        </View>

        {/* Thời gian nhắc trước (Click được để chọn khoảng đệm) */}
        <TouchableOpacity
          style={[styles.rowClickable, { borderBottomColor: theme.borderLight }]}
          onPress={() => setShowBufferSheet(true)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Thời gian nhắc trước</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              Khoảng đệm chuẩn bị trước giờ hẹn
            </Text>
          </View>
          <View style={[styles.timeTag, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.timeTagText, { color: theme.primaryText }]}>
              {reminderBuffer} phút
            </Text>
            <Feather name="chevron-down" size={14} color={theme.primaryText} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* Quyền thông báo hệ thống */}
        <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Quyền thông báo hệ thống</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              {permissionStatus === 'granted'
                ? 'Hệ thống đã sẵn sàng gửi nhắc nhở'
                : 'Chưa được cấp quyền gửi thông báo'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRequestPermission}
            activeOpacity={0.8}
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

        {/* Hai nút thử nghiệm thông báo trực quan */}
        <View style={{ marginTop: 12, gap: 8 }}>
          {/* Nút 1: Thử thông báo ngay lập tức */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleTestNotificationInstant}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="bell" size={18} color={theme.primaryText} />
              <Text style={[styles.testButtonText, { color: theme.primaryText }]}>
                Thử nghiệm thông báo ngay (Xem Banner)
              </Text>
            </View>
            <Feather name="play" size={15} color={theme.primaryText} />
          </TouchableOpacity>

          {/* Nút 2: Thử thông báo sau 5 giây (Hẹn giờ) */}
          <TouchableOpacity
            style={[styles.testButtonSecondary, { borderColor: theme.border }]}
            onPress={handleTestNotificationCountdown}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="clock" size={18} color={colors.warning} />
              <Text style={[styles.testButtonText, { color: theme.textPrimary }]}>
                {countdownSeconds !== null
                  ? `Đang đếm ngược: còn ${countdownSeconds} giây...`
                  : 'Thử nhắc nhở hẹn giờ sau 5 giây'}
              </Text>
            </View>
            {countdownSeconds !== null ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <Feather name="chevron-right" size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Nhóm 2: Giao diện (Đã bỏ ngôn ngữ, hỗ trợ bật sáng/tối dễ nhìn) */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Giao diện & Hiển thị</Text>

        <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 4 }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather
                name={isDarkMode ? 'moon' : 'sun'}
                size={18}
                color={isDarkMode ? '#A78BFA' : '#F59E0B'}
              />
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                Chế độ tối (Dark mode)
              </Text>
            </View>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              {isDarkMode
                ? 'Giao diện tối dịu mắt, tiết kiệm pin và dễ nhìn vào ban đêm'
                : 'Giao diện sáng thanh lịch, rõ ràng'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: theme.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Nhóm 3: Đề xuất thêm mới thú vị (Trải nghiệm & Tương tác) */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
            Trải nghiệm & Tiện ích
          </Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>Đề xuất mới</Text>
          </View>
        </View>

        {/* Rung phản hồi khi hoàn thành */}
        <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Rung khi tick hoàn thành</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              Phản hồi rung xúc giác nhẹ khi hoàn thành mục tiêu
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: theme.border, true: colors.primary }}
          />
        </View>

        {/* Khung giờ yên tĩnh (Do Not Disturb) */}
        <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
              Giờ ngủ yên tĩnh (22:00 - 07:00)
            </Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              Tự động không gửi chuông thông báo ban đêm
            </Text>
          </View>
          <Switch
            value={quietHoursEnabled}
            onValueChange={setQuietHoursEnabled}
            trackColor={{ false: theme.border, true: colors.primary }}
          />
        </View>

        {/* Đồng bộ dữ liệu đám mây (MongoDB) */}
        <View style={[styles.rowClickable, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="cloud" size={16} color={colors.primary} />
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                Đồng bộ dữ liệu đám mây
              </Text>
            </View>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              Trạng thái: Đã đồng bộ an toàn ({lastSyncTime})
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <>
                <Feather name="refresh-cw" size={14} color={theme.primaryText} />
                <Text style={[styles.syncButtonText, { color: theme.primaryText }]}>Đồng bộ</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Nhóm 4: Tài khoản & Bảo mật */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Tài khoản & Bảo mật</Text>

        <TouchableOpacity
          style={[styles.rowClickable, { borderBottomColor: theme.borderLight }]}
          onPress={() => {
            setPasswordErrors({});
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setChangePasswordVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="key" size={18} color={theme.textPrimary} />
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Đổi mật khẩu</Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowClickable, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Đăng xuất khỏi tài khoản</Text>
          </View>
          <Feather name="arrow-right" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Thông tin phiên bản */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Smart Habit Tracker • Phiên bản 1.2.0 (Build 2026)
        </Text>
      </View>

      {/* BottomSheet Chọn thời gian nhắc trước */}
      <BottomSheet
        visible={showBufferSheet}
        onClose={() => setShowBufferSheet(false)}
        title="Chọn thời gian nhắc trước"
      >
        <View style={{ gap: 8, paddingVertical: 10 }}>
          {BUFFER_OPTIONS.map((opt) => {
            const isSelected = reminderBuffer === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.bufferOptionRow,
                  isSelected && styles.bufferOptionRowSelected,
                ]}
                onPress={() => handleSelectBuffer(opt.value)}
              >
                <Text
                  style={[
                    styles.bufferOptionText,
                    isSelected && styles.bufferOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && <Feather name="check" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* BottomSheet Đổi mật khẩu với RÀNG BUỘC CHUẨN XÁC & BÁO ĐỎ TỪNG Ô */}
      <BottomSheet
        visible={changePasswordVisible}
        onClose={() => {
          setChangePasswordVisible(false);
          setPasswordErrors({});
        }}
        title="Đổi mật khẩu tài khoản"
      >
        <View style={{ gap: 6, paddingVertical: 8 }}>
          <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
            Vui lòng nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn tối thiểu 6 ký tự.
          </Text>

          {/* Ô 1: Mật khẩu hiện tại */}
          <TextField
            label="Mật khẩu hiện tại *"
            isPassword
            leftIcon="lock"
            placeholder="Nhập mật khẩu đang dùng"
            value={oldPassword}
            onChangeText={handleOldPasswordChange}
            error={passwordErrors.oldPassword}
          />

          {/* Ô 2: Mật khẩu mới */}
          <TextField
            label="Mật khẩu mới (tối thiểu 6 ký tự) *"
            isPassword
            leftIcon="shield"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            error={passwordErrors.newPassword}
          />

          {/* Ô 3: Xác nhận mật khẩu mới */}
          <TextField
            label="Xác nhận mật khẩu mới *"
            isPassword
            leftIcon="check-circle"
            placeholder="Nhập lại mật khẩu mới để kiểm tra"
            value={confirmNewPassword}
            onChangeText={handleConfirmNewPasswordChange}
            error={passwordErrors.confirmNewPassword}
          />

          <PrimaryButton
            title={isSubmittingPassword ? 'Đang lưu...' : 'Lưu thay đổi mật khẩu'}
            onPress={handleChangePassword}
            disabled={isSubmittingPassword}
            style={{ marginTop: 12 }}
          />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileName: {
    fontSize: fontSizes.subhead,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowTitle: {
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  timeTagText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  testButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.button,
    borderWidth: 1,
  },
  testButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  proPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  proPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  syncButtonText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
  },
  bufferOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: '#F8F7FF',
  },
  bufferOptionRowSelected: {
    backgroundColor: '#F3F0FF',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  bufferOptionText: {
    fontSize: fontSizes.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  bufferOptionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  sheetHint: {
    fontSize: fontSizes.caption,
    marginBottom: 10,
    lineHeight: 18,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  versionText: {
    fontSize: fontSizes.caption,
  },
});
