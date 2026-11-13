import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme/tokens';
import { Achievement } from '../types';

export interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
  onViewAchievements?: () => void;
}

// Các hạt lấp lánh rực rỡ xung quanh huy hiệu
const SPARKLE_ITEMS = [
  { id: 1, angle: 20, dist: 90, icon: '⭐', color: '#F59E0B' },
  { id: 2, angle: 70, dist: 110, icon: '✨', color: '#10B981' },
  { id: 3, angle: 130, dist: 95, icon: '🎉', color: '#8B5CF6' },
  { id: 4, angle: 180, dist: 105, icon: '🌟', color: '#EC4899' },
  { id: 5, angle: 240, dist: 115, icon: '✨', color: '#06B6D4' },
  { id: 6, angle: 300, dist: 90, icon: '⭐', color: '#EAB308' },
  { id: 7, angle: 345, dist: 100, icon: '🎊', color: '#EF4444' },
];

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  achievement,
  visible,
  onClose,
  onViewAchievements,
}) => {
  const { width } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      badgeBounce.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(badgeBounce, {
              toValue: -8,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(badgeBounce, {
              toValue: 0,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [visible, achievement, scaleAnim, opacityAnim, badgeBounce]);

  if (!visible || !achievement) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Hạt hiệu ứng tỏa sáng */}
        {SPARKLE_ITEMS.map((sp) => {
          const rad = (sp.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * sp.dist;
          const ty = Math.sin(rad) * sp.dist;
          return (
            <Animated.View
              key={sp.id}
              style={[
                styles.sparkleItem,
                {
                  transform: [
                    { translateX: tx },
                    { translateY: ty },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{sp.icon}</Text>
            </Animated.View>
          );
        })}

        {/* Khung chúc mừng nhiều màu sắc */}
        <Animated.View
          style={[
            styles.card,
            { width: Math.min(width - 40, 420) },
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Vòng tròn huy hiệu tỏa sáng */}
          <Animated.View
            style={[
              styles.iconGlowWrapper,
              { transform: [{ translateY: badgeBounce }] },
            ]}
          >
            <View style={styles.iconGlowOuter}>
              <View style={styles.iconGlowInner}>
                <Feather
                  name={(achievement.icon as any) || 'award'}
                  size={38}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </Animated.View>

          {/* Dải băng tiêu đề */}
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🎉 THÀNH TÍCH MỚI ĐÃ MỞ KHOÁ! 🎉</Text>
          </View>

          {/* Tên thành tích */}
          <Text style={styles.title}>{achievement.name}</Text>

          {/* Mô tả */}
          <Text style={styles.description}>{achievement.description}</Text>

          {/* Nhãn ghi nhận */}
          <View style={styles.badgeInfoRow}>
            <View style={styles.tierChip}>
              <Feather name="check" size={13} color="#16A34A" />
              <Text style={styles.tierChipText}>Đã hoàn thành xuất sắc</Text>
            </View>
          </View>

          {/* 2 nút hành động */}
          <View style={styles.buttonRow}>
            {Boolean(onViewAchievements) && (
              <TouchableOpacity
                style={styles.viewBoardBtn}
                onPress={() => {
                  onClose();
                  onViewAchievements!();
                }}
                activeOpacity={0.85}
              >
                <Feather name="award" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.viewBoardBtnText}>Xem Bảng thành tích</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Tuyệt vời!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sparkleItem: {
    position: 'absolute',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card + 6,
    paddingTop: 32,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    ...shadows.floating,
  },
  iconGlowWrapper: {
    marginBottom: 16,
  },
  iconGlowOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DDD6FE',
  },
  iconGlowInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  badgeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tierChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  buttonRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  viewBoardBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.cardHover,
  },
  viewBoardBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default AchievementUnlockModal;
