import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';

export interface SegmentedControlProps {
  tabs: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  tabs,
  selectedIndex,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(index)}
            activeOpacity={0.8}
            style={[styles.tab, isSelected && styles.activeTab]}
          >
            <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EFEFF9',
    borderRadius: radii.button,
    padding: 4,
    width: '100%',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button - 4,
  },
  activeTab: {
    backgroundColor: colors.card,
    ...shadows.card,
  },
  tabText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default SegmentedControl;
