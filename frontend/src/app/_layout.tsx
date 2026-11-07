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
import { View, ActivityIndicator } from 'react-native';

import tamaguiConfig from '../../tamagui.config';
import { store, useAppDispatch, useAppSelector } from '../store/store';
import { setCredentials, logout, setLoading } from '../store/authSlice';
import { storage } from '../utils/storage';
import { colors } from '../theme/tokens';
import { mockUser } from '../mock/users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

/**
 * Component kiểm tra token và điều hướng bảo vệ route
 */
function AuthNavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // 1. Kiểm tra token trong storage khi mở app
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await storage.getItem('token');
        const userStr = await storage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch(setCredentials({ token, user }));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        console.warn('Error reading stored auth state:', error);
        dispatch(logout());
      } finally {
        setInitialCheckDone(true);
        dispatch(setLoading(false));
      }
    }

    checkAuth();
  }, [dispatch]);

  // 2. Điều hướng dựa theo trạng thái đăng nhập
  useEffect(() => {
    if (!initialCheckDone) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Chưa đăng nhập mà đang ở ngoài -> Chuyển về màn Login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Đã đăng nhập mà đang ở màn auth -> Chuyển vào (tabs)
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, initialCheckDone, segments, router]);

  if (!initialCheckDone || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <Theme name="light">
            <StatusBar style="dark" />
            <AuthNavigationGuard />
          </Theme>
        </TamaguiProvider>
      </QueryClientProvider>
    </Provider>
  );
}
