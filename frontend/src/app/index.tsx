import React from 'react';
import { YStack, XStack, Text, Card, ScrollView } from 'tamagui';
import { colors, radii, shadows } from '../theme/tokens';
import { mockUser, mockHabits, mockCategories, mockHabitLogs } from '../mock';
import { calculateStats, getGreeting, getVietnameseDateText } from '../utils/date';
import { USE_MOCK, API_BASE_URL } from '../config';

export default function Index() {
  const stats = calculateStats(mockHabits, mockHabitLogs);

  return (
    <ScrollView
      flex={1}
      backgroundColor={colors.background}
      contentContainerStyle={{
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
      }}
    >
      <YStack maxWidth={480} width="100%" gap="$4">
        {/* Header Preview */}
        <YStack gap="$1">
          <Text fontSize={24} fontWeight="700" color={colors.textPrimary}>
            {getGreeting(mockUser.name.split(' ').pop())}
          </Text>
          <Text fontSize={14} color={colors.textSecondary}>
            {getVietnameseDateText()}
          </Text>
        </YStack>

        {/* Card thông báo giai đoạn 1 */}
        <Card
          backgroundColor={colors.card}
          borderRadius={radii.card}
          padding="$4"
          borderWidth={1}
          borderColor={colors.border}
          style={shadows.card}
        >
          <YStack gap="$2">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={16} fontWeight="700" color={colors.primary}>
                🚀 Giai đoạn 1: Khởi tạo hoàn tất
              </Text>
              <XStack
                backgroundColor={colors.successLight}
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius={radii.chip}
              >
                <Text fontSize={12} fontWeight="600" color={colors.success}>
                  {USE_MOCK ? 'MOCK DATA' : 'API LIVE'}
                </Text>
              </XStack>
            </XStack>

            <Text fontSize={13} color={colors.textSecondary}>
              Tamagui theme tokens, Storage đa nền tảng, Kiểu dữ liệu và Bộ Mock Data đã sẵn sàng và khớp 100% CSDL MongoDB Backend.
            </Text>
          </YStack>
        </Card>

        {/* Thẻ thống kê động tính từ HabitLog */}
        <XStack gap="$3" justifyContent="space-between">
          <Card
            flex={1}
            backgroundColor={colors.card}
            borderRadius={radii.card}
            padding="$3"
            alignItems="center"
            borderWidth={1}
            borderColor={colors.border}
          >
            <Text fontSize={12} color={colors.textSecondary}>Chuỗi hiện tại</Text>
            <Text fontSize={22} fontWeight="700" color={colors.warning}>
              🔥 {stats.currentStreak} ngày
            </Text>
          </Card>

          <Card
            flex={1}
            backgroundColor={colors.card}
            borderRadius={radii.card}
            padding="$3"
            alignItems="center"
            borderWidth={1}
            borderColor={colors.border}
          >
            <Text fontSize={12} color={colors.textSecondary}>Tỉ lệ hoàn thành</Text>
            <Text fontSize={22} fontWeight="700" color={colors.primary}>
              {stats.completionRate}%
            </Text>
          </Card>

          <Card
            flex={1}
            backgroundColor={colors.card}
            borderRadius={radii.card}
            padding="$3"
            alignItems="center"
            borderWidth={1}
            borderColor={colors.border}
          >
            <Text fontSize={12} color={colors.textSecondary}>Danh mục</Text>
            <Text fontSize={22} fontWeight="700" color={colors.success}>
              {mockCategories.length}
            </Text>
          </Card>
        </XStack>

        {/* Thông tin kết nối & cấu hình */}
        <Card
          backgroundColor={colors.primaryLight}
          borderRadius={radii.card}
          padding="$3"
          borderWidth={1}
          borderColor={colors.borderLight}
        >
          <YStack gap="$1">
            <Text fontSize={13} fontWeight="600" color={colors.primaryDark}>
              Tài khoản test (Khớp mục 6):
            </Text>
            <Text fontSize={12} color={colors.textPrimary}>
              • Email: <Text fontWeight="700">{mockUser.email}</Text>
            </Text>
            <Text fontSize={12} color={colors.textPrimary}>
              • Mật khẩu: <Text fontWeight="700">123456</Text>
            </Text>
            <Text fontSize={12} color={colors.textSecondary}>
              • Backend API endpoint: {API_BASE_URL}
            </Text>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}
