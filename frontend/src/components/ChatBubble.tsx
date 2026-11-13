import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, shadows } from '../theme/tokens';
import { ChatMessage } from '../types';

export interface ChatBubbleProps {
  message: ChatMessage;
  onActionPress?: (action: string, value?: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onActionPress,
}) => {
  const isUser = message.role === 'user';

  // Tự động tìm kiếm tên thói quen cụ thể được AI gợi ý trong dấu ngoặc kép hoặc ngoặc đơn
  const suggestedHabitTitle = React.useMemo(() => {
    if (isUser) return null;
    if (message.actionButton?.action === 'ADD_HABIT') return null;

    const matches = message.content.match(/['"“]([^'"“”]{4,35})['"”]/g);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const clean = m.replace(/['"“”]/g, '').trim();
        const lower = clean.toLowerCase();
        if (
          !lower.includes('http') &&
          !lower.includes('quy tắc') &&
          !lower.includes('atomic') &&
          !lower.includes('phương pháp') &&
          !lower.includes('trợ lý') &&
          clean.length >= 4
        ) {
          return clean;
        }
      }
    }
    return null;
  }, [message.content, isUser, message.actionButton]);

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.userRow : styles.assistantRow,
      ]}
    >
      {/* Avatar AI nếu là assistant */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Feather name="zap" size={16} color="#FFFFFF" />
        </View>
      )}

      <View style={{ maxWidth: '80%' }}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.text,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {message.content}
          </Text>
        </View>

        {/* Nút hành động đính kèm (Action Button) nếu có */}
        {!isUser && Boolean(message.actionButton) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              onActionPress?.(
                message.actionButton!.action,
                message.actionButton!.value
              )
            }
            style={[
              styles.actionBtn,
              message.actionButton!.action === 'ADD_HABIT' && styles.addHabitActionBtn,
            ]}
          >
            <Feather
              name={message.actionButton!.action === 'ADD_HABIT' ? 'plus-circle' : 'clock'}
              size={14}
              color={message.actionButton!.action === 'ADD_HABIT' ? '#FFFFFF' : colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.actionBtnText,
                message.actionButton!.action === 'ADD_HABIT' && styles.addHabitActionText,
              ]}
            >
              {message.actionButton!.label}
            </Text>
          </TouchableOpacity>
        )}

        {/* Nút nhanh thêm thói quen được AI gợi ý trong văn bản */}
        {!isUser && Boolean(suggestedHabitTitle) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onActionPress?.('ADD_HABIT', suggestedHabitTitle!)}
            style={styles.addHabitActionBtn}
          >
            <Feather name="plus-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addHabitActionText}>
              + Thêm thói quen "{suggestedHabitTitle}"
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  text: {
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.button,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E0DAFD',
  },
  actionBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  addHabitActionBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.card,
  },
  addHabitActionText: {
    color: '#FFFFFF',
  },
});

export default ChatBubble;
