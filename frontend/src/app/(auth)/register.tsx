import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { TextField, PrimaryButton } from '../../components';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store/store';
import { setCredentials } from '../../store/authSlice';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Lỗi hiển thị dưới ô
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validate = (): boolean => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    if (!fullName.trim()) {
      setFullNameError('Vui lòng nhập họ và tên');
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const data = await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      dispatch(setCredentials(data));
      // Đăng ký thành công, chuyển hướng vào nhóm tabs chính
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setGeneralError(err.message || 'Đăng ký tài khoản thất bại');
    } finally {
      setLoading(false);
    }
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
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>
                Bắt đầu xây dựng thói quen tốt cùng Smart Habit
              </Text>
            </View>
          </View>

          {/* Lỗi chung nếu có */}
          {Boolean(generalError) && (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorAlertText}>{generalError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <TextField
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              autoCapitalize="words"
              leftIcon="user"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fullNameError) setFullNameError('');
                if (generalError) setGeneralError('');
              }}
              error={fullNameError}
            />

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
              placeholder="Tối thiểu 6 ký tự"
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

            <TextField
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu vừa nhập"
              leftIcon="check-circle"
              isPassword
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
                if (generalError) setGeneralError('');
              }}
              error={confirmPasswordError}
            />

            {/* Nút Tạo tài khoản */}
            <PrimaryButton
              title="Tạo tài khoản"
              loading={loading}
              onPress={handleRegister}
              style={{ marginTop: 12 }}
            />

            {/* Link quay lại Đăng nhập */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  headerContainer: {
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWrapper: {},
  title: {
    fontSize: fontSizes.title1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginPromptText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: fontSizes.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
