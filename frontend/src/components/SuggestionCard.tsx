import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { Suggestion } from '../types';

export interface SuggestionCardProps {
  suggestion: Suggestion;
  onViewPlan: (suggestion: Suggestion) => void;
  onAddNow: (suggestion: Suggestion) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onViewPlan,
  onAddNow,
}) => {
  const isHighMatch = suggestion.matchLabel === 'Rất phù hợp';

  return (
    <View style={styles.card}>
      {/* Header card */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Feather name="zap" size={20} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.matchBadge,
                isHighMatch ? styles.matchBadgeHigh : styles.matchBadgeNormal,
              ]}
            >
              <Text
                style={[
                  styles.matchBadgeText,
                  isHighMatch ? styles.matchBadgeTextHigh : styles.matchBadgeTextNormal,
                ]}
              >
                {suggestion.matchLabel}
              </Text>
            </View>

            <Text style={styles.tagText}>#{suggestion.tag}</Text>
          </View>

          <Text style={styles.title}>{suggestion.title}</Text>
        </View>
      </View>

      {/* Meta thông tin */}
      <View style={styles.metaRow}>
        <Feather name="clock" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={styles.metaText}>
          {suggestion.frequency === 'daily' ? 'Mỗi ngày' : 'Hàng tuần'} · {suggestion.defaultTime}
        </Text>
      </View>

      {/* Lý do gợi ý */}
      <Text style={styles.reasonText}>{suggestion.reason}</Text>

      {/* Hàng nút bấm */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => onViewPlan(suggestion)}
          activeOpacity={0.8}
          style={styles.viewPlanBtn}
        >
          <Text style={styles.viewPlanText}>Xem kế hoạch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddNow(suggestion)}
          activeOpacity={0.8}
          style={styles.addNowBtn}
        >
          <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addNowText}>Thêm ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.chip,
    marginRight: 8,
  },
  matchBadgeHigh: {
    backgroundColor: colors.successLight,
  },
  matchBadgeNormal: {
    backgroundColor: colors.primaryLight,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchBadgeTextHigh: {
    color: colors.success,
  },
  matchBadgeTextNormal: {
    color: colors.primary,
  },
  tagText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSizes.body + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  reasonText: {
    fontSize: fontSizes.caption + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewPlanBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPlanText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  addNowBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  addNowText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SuggestionCard;
