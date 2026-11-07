import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  SegmentedControl,
  ChatBubble,
  SuggestionCard,
  BottomSheet,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useChat } from '../../hooks/useChat';
import { useStats } from '../../hooks/useStats';
import { quickChatPrompts } from '../../mock/chat';
import { Suggestion } from '../../types';

export default function AiScreen() {
  const router = useRouter();
  const { messages, suggestions, isSending, sendMessage, clearChat } = useChat();
  const { stats } = useStats();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Chat, 1: Gợi ý
  const [inputText, setInputText] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<Suggestion | null>(null);

  const weeklyRate = stats?.weeklyRate ?? 0;

  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    try {
      await sendMessage(text);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
    }
  };

  const handleActionPress = (action: string, value?: string) => {
    if (action === 'UPDATE_TIME') {
      Alert.alert(
        'Đã cập nhật giờ!',
        `Trợ lý đã chuyển giờ nhắc nhở của thói quen sang ${value || '20:00'}.`
      );
    }
  };

  const handleAddSuggestionNow = (sug: Suggestion) => {
    // Điều hướng sang habit/form với query params điền sẵn
    router.push({
      pathname: '/habit/form' as any,
      params: {
        title: sug.title,
        categoryCode: sug.categoryCode,
        frequency: sug.frequency,
        timeSlot: sug.timeSlot,
        reminderTime: sug.defaultTime,
        description: sug.reason,
      },
    });
  };

  // ===================== MỤC 1: CHAT AI =====================
  const chatSection = (
    <View style={styles.chatWrapper}>
      {/* Thanh trạng thái phân tích */}
      <View style={styles.statusPill}>
        <Feather name="activity" size={14} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.statusPillText}>
          Đang phân tích thói quen của bạn · Tỉ lệ duy trì {weeklyRate}%
        </Text>
      </View>

      {/* Danh sách tin nhắn */}
      <ScrollView
        style={styles.messageScroll}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg._id}
            message={msg}
            onActionPress={handleActionPress}
          />
        ))}

        {/* Typing indicator 3 chấm nhấp nháy khi AI đang suy nghĩ */}
        {isSending && (
          <View style={styles.typingRow}>
            <View style={styles.typingAvatar}>
              <Feather name="zap" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Trợ lý AI đang soạn câu trả lời...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chip gợi ý nhanh ngay trên ô nhập */}
      <View style={styles.quickPromptsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {quickChatPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              onPress={() => handleSend(prompt)}
              style={styles.quickPromptChip}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ô nhập + Nút gửi */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Hỏi trợ lý thói quen..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
        >
          <Feather name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ===================== MỤC 2: GỢI Ý =====================
  const suggestionsSection = (
    <View style={styles.suggestionWrapper}>
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.sugTitle}>Gợi ý cho bạn</Text>
        <Text style={styles.sugSubtitle}>
          Dựa trên mục tiêu và thói quen của bạn
        </Text>
      </View>

      {/* Danh sách thẻ gợi ý */}
      {suggestions.map((sug) => (
        <SuggestionCard
          key={sug.id}
          suggestion={sug}
          onViewPlan={(item) => setSelectedPlan(item)}
          onAddNow={handleAddSuggestionNow}
        />
      ))}

      {/* Nút gợi ý khác */}
      <TouchableOpacity
        style={styles.moreSugBtn}
        onPress={() => Alert.alert('Gợi ý', 'Đã tải thêm gợi ý mới phù hợp với bạn!')}
      >
        <Feather name="refresh-cw" size={16} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.moreSugText}>Gợi ý khác</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer scrollable={activeTab === 1}>
      <AppHeader
        title="Trợ lý thói quen ✨"
        rightIcon={activeTab === 0 ? 'rotate-ccw' : undefined}
        onRightPress={clearChat}
      />

      {/* Chuyển đổi Chat | Gợi ý */}
      <SegmentedControl
        tabs={['Chat', 'Gợi ý']}
        selectedIndex={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 0 ? chatSection : suggestionsSection}

      {/* BottomSheet Kế hoạch 7 ngày */}
      <BottomSheet
        visible={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.title || 'Kế hoạch 7 ngày'}
      >
        <View style={{ gap: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: fontSizes.caption + 1, color: colors.textSecondary }}>
            Lộ trình 7 ngày chia làm 3 giai đoạn giúp bạn xây dựng thói quen tự nhiên:
          </Text>

          {selectedPlan?.plan7Days?.map((step, idx) => (
            <View key={idx} style={styles.planStepBox}>
              <View style={styles.planStepBadge}>
                <Text style={styles.planStepNum}>{idx + 1}</Text>
              </View>
              <Text style={styles.planStepText}>{step}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.planAddNowBtn}
            onPress={() => {
              if (selectedPlan) {
                const plan = selectedPlan;
                setSelectedPlan(null);
                handleAddSuggestionNow(plan);
              }
            }}
          >
            <Text style={styles.planAddNowText}>Thêm thói quen này ngay</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chatWrapper: {
    flex: 1,
    minHeight: 450,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.chip,
    marginBottom: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  messageScroll: {
    flex: 1,
    maxHeight: 380,
  },
  messageList: {
    paddingBottom: 10,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingBubble: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  quickPromptsRow: {
    marginVertical: 10,
  },
  quickPromptChip: {
    backgroundColor: colors.card,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 50,
    marginTop: 4,
    ...shadows.card,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  // Gợi ý
  suggestionWrapper: {
    width: '100%',
  },
  sugTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sugSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreSugBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.primaryLight,
    marginTop: 8,
    marginBottom: 20,
  },
  moreSugText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  // Plan BottomSheet
  planStepBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radii.md,
  },
  planStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  planStepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planStepText: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  planAddNowBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...shadows.card,
  },
  planAddNowText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
