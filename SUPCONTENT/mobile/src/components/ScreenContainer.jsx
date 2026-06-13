import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ScreenContainer({
  children,
  backgroundColor,
  contentStyle,
  edges = ['top', 'right', 'bottom', 'left'],
}) {
  const { colors } = useTheme();
  const resolvedBackground = backgroundColor || colors.page;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: resolvedBackground }]} edges={edges}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
