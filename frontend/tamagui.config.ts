import { createTamagui, createTokens } from 'tamagui';
import { shorthands, fonts, media } from '@tamagui/config/v5';
import { colors, radii, spaces, fontSizes } from './src/theme/tokens';

const tokens = createTokens({
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
    white: '#FFFFFF',
    black: '#000000',
  },
  radius: {
    0: radii.none,
    1: radii.xs,
    2: radii.sm,
    3: radii.md,
    4: radii.button,
    5: radii.card,
    6: radii.lg,
    7: radii.xl,
    8: radii.chip,
    button: radii.button,
    card: radii.card,
    chip: radii.chip,
    true: radii.button,
  },
  space: {
    ...spaces,
    true: spaces[4],
  },
  size: {
    ...fontSizes,
    true: fontSizes.body,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
});

export const tamaguiConfig = createTamagui({
  shorthands,
  fonts,
  media,
  tokens,
  themes: {
    light: {
      background: colors.background,
      color: colors.textPrimary,
      primary: colors.primary,
      borderColor: colors.border,
      cardBackground: colors.card,
    },
    dark: {
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
