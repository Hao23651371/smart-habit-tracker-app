import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSizes } from '../theme/tokens';

export interface ProgressRingProps {
  progress: number; // 0 đến 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  centerText?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 90,
  strokeWidth = 9,
  color = colors.primary,
  backgroundColor = colors.borderLight,
  showText = true,
  centerText,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clampedProgress) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Vòng nền */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Vòng tiến độ */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clampedProgress === 100 ? colors.success : color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {showText && (
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.percentText,
              { color: clampedProgress === 100 ? colors.success : colors.textPrimary },
            ]}
          >
            {centerText !== undefined ? centerText : `${Math.round(clampedProgress)}%`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: fontSizes.subhead,
    fontWeight: '700',
  },
});

export default ProgressRing;
