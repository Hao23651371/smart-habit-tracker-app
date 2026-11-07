import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { TextField, PrimaryButton, BottomSheet } from '../../components';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store/store';
import { setCredentials } from '../../store/authSlice';
import { TEST_CREDENTIALS } from '../../mock/users';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Lỗi hiển thị dưới ô
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // BottomSheet Quên mật khẩu
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailTrim = email.trim();
    if (!emailTrim) {
      setEmailError('Vui lòng nhập địa chỉ email');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEmailError('Email không đúng định dạng');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
      });

      dispatch(setCredentials(data));
      // Điều hướng vào nhóm tabs chính
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setGeneralError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  // Điền nhanh tài khoản test mock
  const handleFillTestAccount = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  const handleSendResetLink = () => {
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      Alert.alert('Thông báo', 'Vui lòng nhập đúng định dạng email');
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotPasswordVisible(false);
      setForgotSuccess(false);
      setForgotEmail('');
      Alert.alert('Thành công', 'Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardContainer}>
          {/* Logo & Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Feather name="activity" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Smart Habit</Text>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục theo dõi mục tiêu mỗi ngày
            </Text>
          </View>

          {/* Lỗi chung nếu có */}
          {Boolean(generalError) && (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorAlertText}>{generalError}</Text>
            </View>
          )}

          {/* Form nhập liệu */}
          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="nhap.email@vidu.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                if (generalError) setGeneralError('');
              }}
              error={emailError}
            />

            <TextField
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              leftIcon="lock"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
                if (generalError) setGeneralError('');
              }}
              error={passwordError}
            />

            {/* Quên mật khẩu */}
            <View style={styles.forgotContainer}>
              <TouchableOpacity
                onPress={() => setForgotPasswordVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Nút Đăng nhập */}
            <PrimaryButton
              title="Đăng nhập"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 8 }}
            />

            {/* Chip bấm nhanh tài khoản test */}
            <TouchableOpacity
              onPress={handleFillTestAccount}
              style={styles.testAccountChip}
            >
              <Feather name="key" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.testAccountText}>
                Điền tài khoản test: <Text style={{ fontWeight: '700' }}>an@email.com</Text>
              </Text>
            </TouchableOpacity>

            {/* Link Đăng ký */}
            <View style={styles.registerPrompt}>
              <Text style={styles.registerPromptText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BottomSheet Quên mật khẩu */}
      <BottomSheet
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
        title="Quên mật khẩu"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Text style={{ fontSize: fontSizes.body, color: colors.textSecondary }}>
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu mới.
          </Text>

          <TextField
            label="Email tài khoản"
            placeholder="an@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
            value={forgotEmail}
            onChangeText={setForgotEmail}
          />

          <PrimaryButton
            title="Gửi link đặt lại"
            loading={forgotSuccess}
            onPress={handleSendResetLink}
            style={{ marginTop: 6 }}
          />
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radii.card + 4,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.card,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.floating,
  },
  appName: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: fontSizes.title1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: fontSizes.caption,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: fontSizes.body,
    color: colors.primary,
    fontWeight: '600',
  },
  testAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.chip,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  testAccountText: {
    fontSize: fontSizes.caption,
    color: colors.primaryDark,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerPromptText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: fontSizes.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
