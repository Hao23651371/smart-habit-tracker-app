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
import { colors, radii, fontSizes, shadows } from '../theme/tokens';

export interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
}

// 20 hạt pháo hoa nhiều màu sắc và kích thước
const FIREWORK_PARTICLES = [
  { id: 1, angle: 0, distance: 130, color: '#FFD700', size: 10, icon: '⭐' },
  { id: 2, angle: 25, distance: 160, color: '#EF4444', size: 12, icon: '✨' },
  { id: 3, angle: 50, distance: 120, color: '#3B82F6', size: 8, icon: '🎉' },
  { id: 4, angle: 75, distance: 150, color: '#10B981', size: 14, icon: '🎊' },
  { id: 5, angle: 100, distance: 135, color: '#8B5CF6', size: 11, icon: '✨' },
  { id: 6, angle: 125, distance: 170, color: '#F59E0B', size: 9, icon: '⭐' },
  { id: 7, angle: 150, distance: 140, color: '#EC4899', size: 13, icon: '🎉' },
  { id: 8, angle: 175, distance: 165, color: '#06B6D4', size: 10, icon: '✨' },
  { id: 9, angle: 200, distance: 125, color: '#FFD700', size: 14, icon: '🎊' },
  { id: 10, angle: 225, distance: 155, color: '#22C55E', size: 10, icon: '⭐' },
  { id: 11, angle: 250, distance: 130, color: '#A855F7', size: 12, icon: '✨' },
  { id: 12, angle: 275, distance: 160, color: '#3B82F6', size: 9, icon: '🎉' },
  { id: 13, angle: 300, distance: 145, color: '#F43F5E', size: 11, icon: '⭐' },
  { id: 14, angle: 325, distance: 170, color: '#14B8A6', size: 13, icon: '✨' },
  { id: 15, angle: 345, distance: 135, color: '#EAB308', size: 10, icon: '🎊' },
  { id: 16, angle: 15, distance: 100, color: '#EC4899', size: 8, icon: '⭐' },
  { id: 17, angle: 110, distance: 95, color: '#8B5CF6', size: 9, icon: '✨' },
  { id: 18, angle: 190, distance: 105, color: '#3B82F6', size: 8, icon: '🎉' },
  { id: 19, angle: 280, distance: 100, color: '#10B981', size: 9, icon: '⭐' },
  { id: 20, angle: 330, distance: 110, color: '#F59E0B', size: 10, icon: '✨' },
];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ visible, onClose }) => {
  const { width } = useWindowDimensions();
  const animProgress = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      animProgress.setValue(0);
      cardScale.setValue(0.6);
      cardOpacity.setValue(0);

      // Hiệu ứng nổ pháo hoa + hiện hộp thoại chúc mừng
      Animated.parallel([
        Animated.timing(animProgress, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // Tự động đóng sau đúng 3 giây
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose, animProgress, cardScale, cardOpacity]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Pháo hoa nổ lan toả 360 độ từ tâm */}
        {FIREWORK_PARTICLES.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const targetX = Math.cos(rad) * p.distance;
          const targetY = Math.sin(rad) * p.distance;

          const translateX = animProgress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, targetX * 0.9, targetX],
          });
          const translateY = animProgress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, targetY * 0.9, targetY + 30], // Rơi nhẹ xuống
          });
          const scale = animProgress.interpolate({
            inputRange: [0, 0.25, 0.8, 1],
            outputRange: [0, 1.4, 1, 0.3],
          });
          const opacity = animProgress.interpolate({
            inputRange: [0, 0.15, 0.75, 1],
            outputRange: [0, 1, 1, 0],
          });

          return (
            <Animated.View
              key={p.id}
              style={[
                styles.particle,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={{ fontSize: p.size }}>{p.icon}</Text>
            </Animated.View>
          );
        })}

        {/* Khung chúc mừng trung tâm */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              width: Math.min(width - 40, 360),
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Biểu tượng pháo hoa / cúp */}
          <View style={styles.badgeWrapper}>
            <View style={styles.glowCircle} />
            <Text style={styles.badgeEmoji}>🎆</Text>
          </View>

          <Text style={styles.congratTitle}>Xuất sắc! 100% Hoàn thành</Text>

          <Text style={styles.congratBody}>
            Chúc mừng bạn đã hoàn thành trọn vẹn tất cả thói quen hôm nay! Kỷ luật mỗi ngày chính là chìa khóa tạo nên sự phi thường.
          </Text>

          {/* Nút OK để đóng nhanh */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.okButton}
          >
            <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.okButtonText}>Tuyệt vời (OK)</Text>
          </TouchableOpacity>

          <Text style={styles.autoCloseText}>Tự động đóng sau 3 giây...</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    zIndex: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    zIndex: 20,
    ...shadows.card,
    borderWidth: 1.5,
    borderColor: '#E2DCFC',
  },
  badgeWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  glowCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
  },
  badgeEmoji: {
    fontSize: 38,
  },
  congratTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  congratBody: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  okButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radii.button,
    width: '100%',
    ...shadows.card,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: '700',
  },
  autoCloseText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
  },
});
