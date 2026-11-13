import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  SafeAreaView,
  Platform,
} from 'react-native';
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
  const isWide = width >= 768;

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
    <SafeAreaView style={styles.safeArea}>
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
        >
          {innerContent}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>
          {innerContent}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
    paddingTop: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: 140, // Đảm bảo lớn hơn chiều cao Tab Bar (72px - 98px) để thẻ cuối không bao giờ bị che
  },
  staticContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: 140,
  },
  innerContainer: {
    width: '100%',
  },
});

export default ScreenContainer;
