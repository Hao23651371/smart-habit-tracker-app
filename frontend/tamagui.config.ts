import { createTamagui, createTokens } from 'tamagui';
import { tokens as defaultTokens, themes as defaultThemes } from '@tamagui/themes/v5';
import { shorthands, fonts, media } from '@tamagui/config/v5';
import { colors } from './src/theme/tokens';

const tokens = createTokens({
  ...defaultTokens,
  color: {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    background: colors.background,
    card: colors.card,
    surface: colors.surface,
    success: colors.success,
    warning: colors.warning,
    missed: colors.missed,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    border: colors.border,
    borderLight: colors.borderLight,
    white: '#FFFFFF',
    black: '#000000',
  },
});

export const tamaguiConfig = createTamagui({
  shorthands,
  fonts,
  media,
  tokens,
  themes: {
    ...defaultThemes,
    light: {
      ...defaultThemes.light,
      background: colors.background,
      color: colors.textPrimary,
      primary: colors.primary,
      borderColor: colors.border,
      cardBackground: colors.card,
    },
    dark: {
      ...defaultThemes.dark,
      background: colors.darkBackground,
      color: colors.darkTextPrimary,
      primary: colors.primary,
      borderColor: colors.darkBorder,
      cardBackground: colors.darkCard,
    },
  },
});

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig;
