import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, fontSizes } from '../theme/tokens';

export interface StreakChipProps {
  streak: number;
  label?: string;
  minThreshold?: number;
}

export const StreakChip: React.FC<StreakChipProps> = ({
  streak,
  label = 'ngày liên tiếp',
  minThreshold = 3,
}) => {
  // Ràng buộc: Streak dưới 3 ngày (1, 2) không hiển thị; chỉ từ ngày thứ 3 liên tiếp trở đi mới hiển thị
  if (streak < minThreshold) return null;

  return (
    <View style={styles.chip}>
      <Text style={styles.text}>
        🔥 <Text style={styles.number}>{streak}</Text> {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  text: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: '#B45309',
  },
  number: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#D97706',
  },
});

export default StreakChip;
