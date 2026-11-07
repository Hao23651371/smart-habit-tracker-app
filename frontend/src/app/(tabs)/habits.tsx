import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ScreenContainer,
  AppHeader,
  HabitCard,
  SegmentedControl,
  FilterChips,
  FloatingAddButton,
  EmptyState,
  BottomSheet,
  Skeleton,
} from '../../components';
import { colors, radii, fontSizes, shadows } from '../../theme/tokens';
import { useHabits } from '../../hooks/useHabits';
import { useLogs } from '../../hooks/useLogs';
import { mockCategories } from '../../mock/categories';
import { calculateHabitStreak, getCurrentWeekDays } from '../../utils/date';
import { Habit } from '../../types';

export default function HabitsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const { habits, isLoading } = useHabits();
  const { logs } = useLogs();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Đang theo dõi, 1: Đã lưu trữ
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showCategorySheet, setShowCategorySheet] = useState<boolean>(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Phân loại active & archived
  const activeHabits = useMemo(() => habits.filter((h) => h.status === 'active'), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.status === 'archived'), [habits]);

  const currentList = activeTab === 0 ? activeHabits : archivedHabits;

  // Lọc theo danh mục và tìm kiếm theo tên
  const filteredHabits = useMemo(() => {
    return currentList.filter((h) => {
      const matchCategory =
        selectedCategory === 'all' ||
        h.categoryId === selectedCategory ||
        h.categoryCode === selectedCategory;
      const matchSearch = h.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [currentList, selectedCategory, searchQuery]);

  // Thiết lập thói quen được chọn cho chế độ master-detail
  const detailHabit: Habit | undefined = useMemo(() => {
    if (selectedHabitId) {
      return habits.find((h) => h._id === selectedHabitId);
    }
    return filteredHabits[0];
  }, [selectedHabitId, filteredHabits, habits]);

  // Options cho FilterChips danh mục
  const categoryOptions = useMemo(() => {
    const list = [{ id: 'all', label: 'Tất cả', count: currentList.length }];
    for (const cat of mockCategories) {
      const count = currentList.filter(
        (h) => h.categoryId === cat._id || h.categoryCode === cat.code
      ).length;
      if (count > 0 || activeTab === 0) {
        list.push({ id: cat.code, label: cat.name, count });
      }
    }
    return list;
  }, [currentList, activeTab]);

  const weekDays = getCurrentWeekDays();

  if (isLoading) {
    return (
      <ScreenContainer>
        <AppHeader title="Thói quen của tôi" />
        <Skeleton height={44} style={{ marginBottom: 12 }} />
        <Skeleton height={40} style={{ marginBottom: 16 }} />
        <Skeleton height={90} style={{ marginBottom: 12 }} />
        <Skeleton height={90} style={{ marginBottom: 12 }} />
      </ScreenContainer>
    );
  }

  // Danh sách thói quen
  const listColumn = (
    <View style={{ flex: 1 }}>
      {/* Segmented Control */}
      <SegmentedControl
        tabs={[`Đang theo dõi (${activeHabits.length})`, `Đã lưu trữ (${archivedHabits.length})`]}
        selectedIndex={activeTab}
        onChange={(idx) => {
          setActiveTab(idx);
          setSelectedCategory('all');
        }}
      />

      {/* Filter Chips danh mục */}
      <FilterChips
        options={categoryOptions}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
        appendAction={{
          label: '+ Danh mục',
          icon: 'plus',
          onPress: () => setShowCategorySheet(true),
        }}
      />

      {/* Danh sách */}
      {filteredHabits.length === 0 ? (
        <EmptyState
          icon={activeTab === 0 ? 'list' : 'archive'}
          title={
            searchQuery
              ? 'Không tìm thấy thói quen'
              : activeTab === 0
              ? 'Chưa có thói quen theo dõi'
              : 'Chưa có thói quen lưu trữ'
          }
          description={
            searchQuery
              ? `Không có kết quả nào khớp với "${searchQuery}". Hãy thử từ khoá khác.`
              : activeTab === 0
              ? 'Hãy tạo thói quen đầu tiên để bắt đầu theo dõi!'
              : 'Những thói quen đã lưu trữ sẽ xuất hiện tại đây.'
          }
          actionLabel={activeTab === 0 && !searchQuery ? 'Thêm thói quen' : undefined}
          onAction={activeTab === 0 && !searchQuery ? () => router.push('/habit/form' as any) : undefined}
        />
      ) : (
        <View style={{ marginTop: 8 }}>
          {filteredHabits.map((h) => {
            const streak = calculateHabitStreak(h._id, logs);
            // Dải 7 ngày tuần này
            const weekProgress = weekDays.map((day) =>
              logs.some((l) => l.habitId === h._id && l.date === day && l.status === 'done')
            );

            return (
              <HabitCard
                key={h._id}
                habit={h}
                variant="list"
                streak={streak}
                weekProgress={weekProgress}
                onPress={() => {
                  if (isWide) {
                    setSelectedHabitId(h._id);
                  } else {
                    router.push(`/habit/${h._id}` as any);
                  }
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );

  // Cột chi tiết bên phải khi ở chế độ rộng (Master - Detail)
  const detailColumn = isWide && detailHabit && (
    <View style={styles.detailPane}>
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View
            style={[
              styles.detailIconBox,
              { backgroundColor: `${detailHabit.color || colors.primary}1A` },
            ]}
          >
            <Feather
              name={(detailHabit.icon as any) || 'activity'}
              size={28}
              color={detailHabit.color || colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.detailTitle}>{detailHabit.title}</Text>
            <Text style={styles.detailSubtitle}>
              {detailHabit.frequency === 'daily' ? 'Mỗi ngày' : 'Hàng tuần'} · {detailHabit.reminderTime}
            </Text>
          </View>
        </View>

        {Boolean(detailHabit.description) && (
          <Text style={styles.detailDesc}>{detailHabit.description}</Text>
        )}

        <View style={styles.detailStatsRow}>
          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatNum}>
              🔥 {calculateHabitStreak(detailHabit._id, logs)}
            </Text>
            <Text style={styles.detailStatLabel}>Streak hiện tại</Text>
          </View>
          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatNum}>{detailHabit.targetValue}</Text>
            <Text style={styles.detailStatLabel}>Mục tiêu ({detailHabit.unit || 'lần'})</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/habit/${detailHabit._id}` as any)}
          style={styles.openFullDetailBtn}
        >
          <Text style={styles.openFullDetailText}>Xem chi tiết & lịch sử đầy đủ</Text>
          <Feather name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header với nút tìm kiếm */}
      <AppHeader
        title="Thói quen của tôi"
        rightIcon={showSearch ? 'x' : 'search'}
        onRightPress={() => {
          setShowSearch(!showSearch);
          if (showSearch) setSearchQuery('');
        }}
      />

      {/* Thanh tìm kiếm khi mở */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thói quen theo tên..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Bố cục master-detail khi rộng */}
      <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
        {listColumn}
        {detailColumn}
      </View>

      {/* Floating Add Button */}
      <FloatingAddButton onPress={() => router.push('/habit/form' as any)} />

      {/* BottomSheet xem danh sách danh mục */}
      <BottomSheet
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="Danh mục thói quen"
      >
        <View style={{ gap: 10, paddingVertical: 8 }}>
          {mockCategories.map((cat) => (
            <View key={cat._id} style={styles.categoryItemRow}>
              <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryNameText}>{cat.name}</Text>
              <Text style={styles.categoryCodeBadge}>#{cat.code}</Text>
            </View>
          ))}
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainLayout: {
    width: '100%',
  },
  mainLayoutWide: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  detailPane: {
    flex: 1,
    position: 'sticky' as any,
    top: 24,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: fontSizes.title2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailDesc: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  detailStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  detailStatBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: 14,
    alignItems: 'center',
  },
  detailStatNum: {
    fontSize: fontSizes.title3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  detailStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  openFullDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.button,
    paddingVertical: 12,
    gap: 6,
  },
  openFullDetailText: {
    fontSize: fontSizes.caption + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryNameText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  categoryCodeBadge: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
