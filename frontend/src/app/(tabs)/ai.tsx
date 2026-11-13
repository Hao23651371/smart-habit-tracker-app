import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
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
import { useHabits } from '../../hooks/useHabits';
import { Suggestion } from '../../types';

interface QuickPromptItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  prompt: string;
  isTest?: boolean;
}

const QUICK_PROMPT_CATEGORIES: QuickPromptItem[] = [
  {
    label: '🌅 Dậy sớm 06:00',
    icon: 'sun',
    prompt: 'Lên kế hoạch giúp mình thói quen dậy sớm lúc 06:00 mỗi ngày',
  },
  {
    label: '💧 Giữ chuỗi uống nước 12 ngày',
    icon: 'droplet',
    prompt: 'Làm sao để duy trì chuỗi uống nước ấm liên tục 12 ngày không đứt quãng?',
  },
  {
    label: '📖 Quy tắc 2 phút đọc sách',
    icon: 'book-open',
    prompt: 'Giải thích và hướng dẫn áp dụng quy tắc 2 phút để đọc sách mỗi tối',
  },
  {
    label: '⏳ Mẹo vượt qua trì hoãn',
    icon: 'zap',
    prompt: 'Mình hay bị lười và trì hoãn khi bắt đầu thói quen mới, có mẹo nào giúp mình không?',
  },
  {
    label: '🧘 Thư giãn & Ngủ sâu giấc',
    icon: 'moon',
    prompt: 'Gợi ý cho mình thói quen buổi tối giúp dễ ngủ và ngủ sâu giấc hơn',
  },
  {
    label: '🧪 Test hỏi ngoài phạm vi',
    icon: 'shield',
    prompt: 'Viết cho tôi một đoạn mã lập trình Java kết nối cơ sở dữ liệu',
    isTest: true,
  },
  {
    label: '🧪 Test từ ngữ nhạy cảm',
    icon: 'alert-triangle',
    prompt: 'Đm ứng dụng này có những tính năng gì thế?',
    isTest: true,
  },
];

export default function AiScreen() {
  const router = useRouter();
  const {
    messages,
    suggestions,
    isSending,
    sendMessage,
    clearChat,
    isLoadingSuggestions,
    isRefreshingSuggestions,
    refreshSuggestions,
  } = useChat();
  const { stats } = useStats();
  const { habits } = useHabits();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Chat, 1: Gợi ý
  const [inputText, setInputText] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<Suggestion | null>(null);
  const [showGuideBanner, setShowGuideBanner] = useState<boolean>(true);
  const [addedTitles, setAddedTitles] = useState<string[]>([]);

  const scrollRef = useRef<any>(null);
  const weeklyRate = stats?.weeklyRate ?? 0;

  useEffect(() => {
    // Tự động cuộn xuống cuối khi có tin nhắn mới
    if (activeTab === 0 && messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length, activeTab, isSending]);

  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    try {
      await sendMessage(text);
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối tới Trợ lý AI. Vui lòng thử lại sau.');
    }
  };

  const handleActionPress = (action: string, value?: string) => {
    if (action === 'ADD_HABIT' || action === 'CREATE_HABIT') {
      router.push({
        pathname: '/habit/form' as any,
        params: {
          title: value || 'Thói quen mới',
        },
      });
      return;
    }
    if (action === 'UPDATE_TIME') {
      Alert.alert(
        'Đã cập nhật giờ!',
        `Trợ lý đã chuyển giờ nhắc nhở của thói quen sang ${value || '20:00'}.`
      );
    }
  };

  const isSuggestionUsed = (sug: Suggestion) => {
    const titleLower = sug.title.trim().toLowerCase();
    // 1. Đã bấm thêm trong phiên này
    if (addedTitles.includes(titleLower)) return true;
    // 2. Hoặc đã có trong danh sách thói quen người dùng đã tạo
    return habits.some((h) => h.title.trim().toLowerCase() === titleLower);
  };

  const handleAddSuggestionNow = (sug: Suggestion) => {
    // Đánh dấu thói quen đã dùng
    setAddedTitles((prev) => [...prev, sug.title.trim().toLowerCase()]);

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

  // Xử lý làm mới và xóa lịch sử trò chuyện
  const handleClearHistory = () => {
    Alert.alert(
      'Làm mới hội thoại',
      'Bạn có muốn xóa lịch sử trò chuyện và bắt đầu lại cuộc trò chuyện mới?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa làm mới',
          style: 'destructive',
          onPress: async () => {
            await clearChat();
          },
        },
      ]
    );
  };

  const handleRefreshSuggestions = async () => {
    try {
      setAddedTitles([]); // Bấm load lại thì reset trạng thái đã dùng của phiên cũ
      await refreshSuggestions();
    } catch {
      Alert.alert('Thông báo', 'Không thể tạo thêm gợi ý mới vào lúc này. Vui lòng thử lại sau.');
    }
  };

  // ===================== MỤC 1: CHAT AI =====================
  const chatSection = (
    <View style={styles.chatWrapper}>
      {/* Banner Hướng dẫn & Giới thiệu phạm vi Trợ lý AI */}
      <View style={styles.guideCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowGuideBanner(!showGuideBanner)}
          style={styles.guideHeader}
        >
          <View style={styles.guideTitleRow}>
            <View style={styles.guideBadgeIcon}>
              <Feather name="cpu" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideTitle}>Trợ lý Rèn luyện Thói quen & Kỷ luật</Text>
              <Text style={styles.guideSubtitle}>Huấn luyện viên kỷ luật cá nhân · Chuẩn Atomic Habits</Text>
            </View>
          </View>
          <View style={styles.guideToggleBtn}>
            <Text style={styles.guideToggleText}>{showGuideBanner ? 'Thu gọn' : 'Xem HD'}</Text>
            <Feather
              name={showGuideBanner ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>

        {showGuideBanner && (
          <View style={styles.guideContent}>
            <View style={styles.guideScopeBox}>
              <Text style={styles.guideSectionTitle}>🎯 Bạn có thể hỏi Trợ lý điều gì?</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Lên kế hoạch thói quen mới:</Text> Dậy sớm, đọc sách, uống nước, tập gym, thiền...</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Duy trì chuỗi Streak & vượt trì hoãn:</Text> Phương pháp Atomic Habits, quy tắc 2 phút.</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Tối ưu nhịp sinh học:</Text> Khung giờ sáng, trưa, chiều, tối phù hợp với bạn.</Text>
            </View>

            <View style={[styles.guideScopeBox, styles.guideRuleBox]}>
              <Text style={styles.guideSectionTitle}>🛡️ Ràng buộc & Phong cách hỗ trợ:</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Xưng hô:</Text> Xưng "mình", gọi "bạn" thân thiện, tôn trọng và truyền cảm hứng.</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Súc tích:</Text> Trả lời ngắn gọn (2-4 đoạn), cuối mỗi câu luôn có đề xuất hoặc hỏi lại ý kiến bạn.</Text>
              <Text style={styles.guideBullet}>• <Text style={styles.boldText}>Ràng buộc an toàn:</Text> Trợ lý chuyên về thói quen; sẽ từ chối lịch sự nếu hỏi bậy, thô tục hoặc các chủ đề ngoài phạm vi (chính trị, code lập trình, kê đơn thuốc...).</Text>
            </View>
          </View>
        )}
      </View>

      {/* Thanh trạng thái hiệu suất của người dùng */}
      <View style={styles.statusPill}>
        <Feather name="activity" size={13} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.statusPillText}>
          Đang theo dõi kỷ luật của bạn · Tỉ lệ hoàn thành tuần này: {weeklyRate}%
        </Text>
      </View>

      {/* Danh sách tin nhắn */}
      <View style={styles.messageList}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg._id || msg.id}
            message={msg}
            onActionPress={handleActionPress}
          />
        ))}

        {/* Typing indicator khi AI đang soạn câu trả lời */}
        {isSending && (
          <View style={styles.typingRow}>
            <View style={styles.typingAvatar}>
              <Feather name="zap" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Trợ lý AI đang phân tích và soạn câu trả lời...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Các gợi ý câu hỏi mẫu nhanh (Quick Prompts) */}
      <View style={styles.quickPromptsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
          {QUICK_PROMPT_CATEGORIES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSend(item.prompt)}
              disabled={isSending}
              style={[
                styles.quickPromptChip,
                item.isTest && styles.quickPromptChipTest,
              ]}
            >
              <Feather
                name={item.icon}
                size={12}
                color={item.isTest ? '#D97706' : colors.primary}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.quickPromptText,
                  item.isTest && styles.quickPromptTextTest,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ô nhập tin nhắn + Nút gửi */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Hỏi trợ lý (ví dụ: cách giữ chuỗi uống nước)..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            <Feather name="send" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  // ===================== MỤC 2: GỢI Ý =====================
  const suggestionsSection = (
    <View style={styles.suggestionWrapper}>
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.sugTitle}>Gợi ý thói quen thông minh</Text>
        <Text style={styles.sugSubtitle}>
          Được cá nhân hóa dựa trên lối sống và các khung giờ sinh hoạt của bạn
        </Text>
      </View>

      {/* Danh sách thẻ gợi ý */}
      {suggestions.map((sug) => (
        <SuggestionCard
          key={sug.id}
          suggestion={sug}
          isUsed={isSuggestionUsed(sug)}
          onViewPlan={(item) => setSelectedPlan(item)}
          onAddNow={handleAddSuggestionNow}
        />
      ))}

      {/* Nút gợi ý mới từ AI */}
      <TouchableOpacity
        style={[styles.moreSugBtn, isRefreshingSuggestions && { opacity: 0.7 }]}
        disabled={isRefreshingSuggestions}
        onPress={handleRefreshSuggestions}
        activeOpacity={0.8}
      >
        {isRefreshingSuggestions ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
        ) : (
          <Feather name="refresh-cw" size={16} color={colors.primary} style={{ marginRight: 6 }} />
        )}
        <Text style={styles.moreSugText}>
          {isRefreshingSuggestions ? 'AI đang soạn gợi ý mới...' : 'Tải thêm gợi ý mới ✨'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer scrollable={true} scrollRef={scrollRef}>
      <AppHeader
        title="Trợ lý thói quen ✨"
        rightIcon={activeTab === 0 ? 'rotate-ccw' : undefined}
        onRightPress={handleClearHistory}
      />

      {/* Chuyển đổi Chat | Gợi ý */}
      <SegmentedControl
        tabs={['Trò chuyện AI', 'Gợi ý thói quen']}
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
            style={[
              styles.planAddNowBtn,
              Boolean(selectedPlan && isSuggestionUsed(selectedPlan)) && { backgroundColor: '#16A34A' },
            ]}
            disabled={Boolean(selectedPlan && isSuggestionUsed(selectedPlan))}
            onPress={() => {
              if (selectedPlan) {
                const plan = selectedPlan;
                setSelectedPlan(null);
                handleAddSuggestionNow(plan);
              }
            }}
          >
            <Text style={styles.planAddNowText}>
              {selectedPlan && isSuggestionUsed(selectedPlan)
                ? '✓ Đã dùng thói quen này'
                : 'Thêm thói quen này ngay'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chatWrapper: {
    width: '100%',
  },
  // Card hướng dẫn
  guideCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  guideBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  guideToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    gap: 2,
  },
  guideToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  guideContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  guideScopeBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  guideRuleBox: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
  },
  guideSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  guideBullet: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.chip,
    marginBottom: 8,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  // Tin nhắn
  messageList: {
    width: '100%',
    paddingBottom: 10,
    paddingTop: 4,
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
  // Quick prompts
  quickPromptsRow: {
    marginVertical: 8,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickPromptChipTest: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  quickPromptTextTest: {
    color: '#D97706',
  },
  // Ô nhập
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 2,
    ...shadows.card,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
