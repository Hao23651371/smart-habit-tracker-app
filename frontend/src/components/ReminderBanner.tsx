import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows, fontSizes } from '../theme/tokens';

export interface ReminderBannerProps {
  visible: boolean;
  title: string;
  body: string;
  icon?: string;
  isSpecialStart?: boolean;
  onAction: () => void;
  onConfirm?: () => void;
  onDismiss: () => void;
}

/** Component hiển thị biểu ngữ nhắc nhở với các nút Xác nhận và Làm ngay */
export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  visible,
  title,
  body,
  icon = 'bell',
  isSpecialStart = false,
  onAction,
  onConfirm,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        entering={FadeInUp.duration(300)}
        exiting={FadeOutUp.duration(250)}
        style={[styles.card, isSpecialStart && styles.specialCard]}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconBadge, isSpecialStart && styles.specialIconBadge]}>
            <Feather
              name={isSpecialStart ? 'zap' : (icon as any)}
              size={20}
              color={isSpecialStart ? '#7C5CFC' : colors.primary}
            />
          </View>

          <View style={styles.textContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Text style={styles.bodyText} numberOfLines={2}>
              {body}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDismiss}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          {onConfirm && (
            <TouchableOpacity activeOpacity={0.8} onPress={onConfirm} style={styles.confirmButton}>
              <Feather name="check" size={14} color="#16A34A" style={{ marginRight: 4 }} />
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionText}>{isSpecialStart ? 'Vào làm ngay' : 'Làm ngay'}</Text>
            <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DCFC',
    ...shadows.floating,
  },
  specialCard: {
    borderColor: '#7C5CFC',
    borderWidth: 2,
    backgroundColor: '#FAF8FF',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  specialIconBadge: {
    backgroundColor: '#EDE9FE',
  },
  textContainer: {
    flex: 1,
    paddingRight: 6,
  },
  titleText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  confirmText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.button,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ReminderBanner;
