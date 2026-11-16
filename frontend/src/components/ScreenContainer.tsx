import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  scrollRef?: any;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  scrollRef,
  style,
  contentContainerStyle,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  // Tính toán khoảng cách an toàn phía trên (Top Safe Area Inset) để tránh thanh tác vụ (Status Bar)
  // và camera đục lỗ (Cutout/Punch Hole) trên Android & iOS:
  // - Android: StatusBar.currentHeight hoặc insets.top, thêm 14px để chữ/icon có khoảng cách thoáng đãng
  // - iOS: insets.top (Dynamic Island / tai thỏ) thêm 10px
  // - Web: Cố định 24px
  const topPadding = Platform.OS === 'web'
    ? 24
    : Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 0, 38) + 14
      : Math.max(insets.top, 20) + 10;

  const innerContent = (
    <View
      style={[
        styles.innerContainer,
        { maxWidth: isWide ? 1100 : 480 },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
        >
          {innerContent}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.staticContent,
            { paddingTop: topPadding },
            contentContainerStyle,
          ]}
        >
          {innerContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 140, // Đảm bảo lớn hơn chiều cao Tab Bar (72px - 98px) để thẻ cuối không bao giờ bị che
  },
  staticContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  innerContainer: {
    width: '100%',
  },
});

export default ScreenContainer;
