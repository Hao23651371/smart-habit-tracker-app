import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';

import tamaguiConfig from '../../tamagui.config';
import { store, useAppDispatch, useAppSelector } from '../store/store';
import { setCredentials, logout, setLoading } from '../store/authSlice';
import { storage } from '../utils/storage';
import { colors } from '../theme/tokens';
import { useHabits } from '../hooks/useHabits';
import { useInAppReminder } from '../hooks/useInAppReminder';
import { useNotificationResponse } from '../hooks/useNotificationResponse';
import { rescheduleAll, requestPermission } from '../utils/notifications';
import { getReminderCopy } from '../utils/reminderCopy';
import { ReminderBanner } from '../components/ReminderBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/** Điều hướng bảo vệ màn hình dựa theo trạng thái đăng nhập */
function AuthNavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await storage.getItem('token');
        const userStr = await storage.getItem('user');
        // Tự động xoá token giả lập cũ nếu còn lưu trong máy
        if (token && (token.startsWith('mock-') || !token.includes('.'))) {
          await storage.removeItem('token');
          await storage.removeItem('user');
          dispatch(logout());
        } else if (token && userStr) {
          dispatch(setCredentials({ token, user: JSON.parse(userStr) }));
        } else {
          dispatch(logout());
        }
      } catch {
        dispatch(logout());
      } finally {
        setInitialCheckDone(true);
        dispatch(setLoading(false));
      }
    }
    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    if (!initialCheckDone) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, initialCheckDone, segments, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {(!initialCheckDone || isLoading) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
              zIndex: 99999,
            },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

/** Quản lý biểu ngữ nhắc nhở và đồng bộ thông báo toàn ứng dụng */
function AppReminderController() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { habits } = useHabits();
  const { activeReminder, dismissReminder, confirmReminder } = useInAppReminder();
  useNotificationResponse();

  useEffect(() => {
    if (user?.settings?.notificationsEnabled === false) return;
    if (Platform.OS !== 'web') {
      requestPermission().then(() => {
        if (habits.length > 0) rescheduleAll(habits);
      });
    } else if (habits.length > 0) {
      rescheduleAll(habits);
    }
  }, [user?.settings?.notificationsEnabled, habits]);

  const copy = activeReminder
    ? getReminderCopy(activeReminder.habit, activeReminder.type, activeReminder.minutesLeft)
    : null;

  return (
    <>
      <AuthNavigationGuard />
      {activeReminder && copy && (
        <ReminderBanner
          visible={true}
          title={copy.title}
          body={copy.body}
          icon={copy.icon}
          isSpecialStart={activeReminder.type === 'start'}
          onConfirm={() => confirmReminder(activeReminder.habit._id)}
          onAction={() => {
            dismissReminder();
            router.push(`/habit/${activeReminder.habit._id}` as any);
          }}
          onDismiss={dismissReminder}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <Theme name="light">
            <StatusBar style="dark" />
            <AppReminderController />
          </Theme>
        </TamaguiProvider>
      </QueryClientProvider>
    </Provider>
  );
}
