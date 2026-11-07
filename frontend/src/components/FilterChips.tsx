import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes } from '../theme/tokens';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: keyof typeof Feather.glyphMap;
}

export interface FilterChipsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  appendAction?: {
    label: string;
    icon?: keyof typeof Feather.glyphMap;
    onPress: () => void;
  };
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selectedId,
  onSelect,
  appendAction,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.8}
              style={[styles.chip, isSelected && styles.activeChip]}
            >
              {Boolean(opt.icon) && (
                <Feather
                  name={opt.icon!}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={[styles.label, isSelected && styles.activeLabel]}>
                {opt.label}
              </Text>
              {opt.count !== undefined && (
                <View
                  style={[
                    styles.badge,
                    isSelected && styles.activeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected && styles.activeBadgeText,
                    ]}
                  >
                    {opt.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {Boolean(appendAction) && (
          <TouchableOpacity
            onPress={appendAction!.onPress}
            activeOpacity={0.8}
            style={styles.appendChip}
          >
            {Boolean(appendAction!.icon) && (
              <Feather
                name={appendAction!.icon!}
                size={14}
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={styles.appendLabel}>{appendAction!.label}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
  appendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  appendLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default FilterChips;
