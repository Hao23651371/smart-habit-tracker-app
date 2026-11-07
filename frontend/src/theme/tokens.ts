/**
 * Design Tokens thống nhất toàn bộ ứng dụng Smart Habit Tracker
 * Tuân thủ theo mục 4 của đặc tả thiết kế.
 */

export const colors = {
  // Màu thương hiệu
  primary: '#7C5CFC',
  primaryLight: '#F3F0FF',
  primaryDark: '#5E3BEE',

  // Màu nền & thẻ
  background: '#F8F7FF',
  card: '#FFFFFF',
  surface: '#FFFFFF',

  // Màu trạng thái
  success: '#22C55E',       // Hoàn thành / Đúng hạn
  successLight: '#DCFCE7',
  warning: '#F59E0B',       // Sắp mất chuỗi / Nhắc nhở
  warningLight: '#FEF3C7',
  missed: '#FCA5A5',        // Bỏ lỡ (nhẹ nhàng, không đỏ đậm)
  missedLight: '#FEE2E2',

  // Màu chữ
  textPrimary: '#25233A',   // Chữ chính
  textSecondary: '#6B6880', // Chữ phụ
  textMuted: '#9CA3AF',     // Chữ mờ
  textInverse: '#FFFFFF',   // Chữ trên nền màu

  // Màu viền & ngăn cách
  border: '#E8E5F5',
  borderLight: '#F3F0FF',

  // Dark Mode Tokens (chuẩn bị sẵn)
  darkBackground: '#12111A',
  darkCard: '#1E1C2B',
  darkTextPrimary: '#F8F7FF',
  darkTextSecondary: '#A5A2BD',
  darkBorder: '#2E2B42',
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  button: 16, // Bo góc nút chuẩn: 16
  card: 20,   // Bo góc thẻ chuẩn: 20
  lg: 24,
  xl: 32,
  chip: 999,  // Bo góc chip chuẩn: 999
  full: 9999,
} as const;

export const spaces = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const fontSizes = {
  caption: 12, // Cỡ chữ tối thiểu: 12
  sm: 13,
  body: 14,
  subhead: 16,
  title3: 18,
  title2: 20,
  title1: 24,  // Tiêu đề màn hình: 24 đậm
  display: 32,
  huge: 40,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadows = {
  card: {
    shadowColor: '#25233A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  floating: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
