import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, radii, shadows } from '../../theme/tokens';

const TAB_CONFIG: Array<{ name: string; path: string; label: string; icon: any }> = [
  { name: 'index', path: '/(tabs)', label: 'Hôm nay', icon: 'check-circle' },
  { name: 'habits', path: '/(tabs)/habits', label: 'Thói quen', icon: 'list' },
  { name: 'calendar', path: '/(tabs)/calendar', label: 'Lịch', icon: 'calendar' },
  { name: 'ai', path: '/(tabs)/ai', label: 'Trợ lý AI', icon: 'message-circle' },
  { name: 'profile', path: '/(tabs)/profile', label: 'Cá nhân', icon: 'user' },
];

/**
 * Navigation Rail dành riêng cho màn hình rộng (Tablet / Web Desktop >= 768px):
 * Cột dọc cao 100%, nằm sát mép trái, đủ 5 mục điều hướng.
 */
function WideNavigationRail() {
  const router = useRouter();
  const pathname = usePathname();

  const isRouteActive = (item: (typeof TAB_CONFIG)[0]) => {
    if (item.name === 'index') {
      return (
        pathname === '/' ||
        pathname === '/index' ||
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/index'
      );
    }
    return pathname.includes(item.name);
  };

  return (
    <View style={styles.railContainer}>
      {/* Logo Thương hiệu */}
      <View style={styles.railLogoWrapper}>
        <View style={styles.railLogo}>
          <Feather name="activity" size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.railLogoTitle}>Smart Habit</Text>
          <Text style={styles.railLogoSubtitle}>Tracker</Text>
        </View>
      </View>

      {/* 5 Mục điều hướng */}
      <View style={styles.railNavList}>
        {TAB_CONFIG.map((item) => {
          const isActive = isRouteActive(item);
          return (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.8}
              onPress={() => router.replace(item.path as any)}
              style={[styles.railItem, isActive && styles.railItemActive]}
            >
              <Feather
                name={item.icon}
                size={20}
                color={isActive ? colors.primary : colors.textSecondary}
                style={styles.railItemIcon}
              />
              <Text
                style={[
                  styles.railItemText,
                  isActive && styles.railItemTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  // 1. Chiều cao tab bar: khoảng 64 + safe area bottom inset, không để bị cắt chữ
  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 64 + (insets.bottom > 0 ? insets.bottom : 8);

  // 2. Cỡ chữ nhãn: trên màn hình nhỏ (iPhone 5 320px) dùng 10px, màn thông thường (Galaxy S24, iPhone 17 Pro Max) dùng 11px
  const labelFontSize = width < 360 ? 10 : 11;

  return (
    <View style={[styles.layoutWrapper, isWide && styles.layoutWrapperWide]}>
      {/* Màn hình rộng (>= 768px): Cột dọc Rail nằm sát trái, cao 100% */}
      {isWide && <WideNavigationRail />}

      {/* Phần nội dung màn hình Tabs chuẩn Expo Router */}
      <View style={styles.screenWrapper}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isWide
              ? { display: 'none' }
              : [
                  styles.bottomBarContainer,
                  {
                    height: tabHeight,
                    paddingTop: 8,
                    paddingBottom: bottomInset,
                    overflow: 'visible',
                  },
                ],
            tabBarItemStyle: styles.tabBarItem,
            tabBarLabelStyle: [
              styles.bottomTabText,
              {
                fontSize: labelFontSize,
                lineHeight: 14,
                marginBottom: 2,
              },
            ],
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Hôm nay',
              tabBarIcon: (props: any) => (
                <Feather name="check-circle" size={22} color={props.color} />
              ),
            }}
          />
          <Tabs.Screen
            name="habits"
            options={{
              title: 'Thói quen',
              tabBarIcon: (props: any) => (
                <Feather name="list" size={22} color={props.color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'Lịch',
              tabBarIcon: (props: any) => (
                <Feather name="calendar" size={22} color={props.color} />
              ),
            }}
          />
          <Tabs.Screen
            name="ai"
            options={{
              title: 'Trợ lý AI',
              tabBarIcon: (props: any) => (
                <Feather name="message-circle" size={22} color={props.color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Cá nhân',
              tabBarIcon: (props: any) => (
                <Feather name="user" size={22} color={props.color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  layoutWrapperWide: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  screenWrapper: {
    flex: 1,
    height: '100%',
    overflow: 'visible',
  },
  // Rail dọc trên màn hình rộng
  railContainer: {
    width: 240,
    height: '100%',
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 36,
    paddingHorizontal: 16,
    zIndex: 10,
    ...shadows.card,
  },
  railLogoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  railLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...shadows.floating,
  },
  railLogoTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primary,
  },
  railLogoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  railNavList: {
    gap: 8,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.button,
  },
  railItemActive: {
    backgroundColor: colors.primaryLight,
  },
  railItemIcon: {
    marginRight: 12,
  },
  railItemText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  railItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  // Thanh Tab Bar đáy trên mobile
  bottomBarContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...shadows.floating,
  },
  tabBarItem: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
