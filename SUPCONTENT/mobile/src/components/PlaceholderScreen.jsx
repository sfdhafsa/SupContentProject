import { StyleSheet, Text, View } from 'react-native';
import BottomTabBar from './BottomTabBar';
import ScreenContainer from './ScreenContainer';
import TopNavbar from './TopNavbar';
import { useBottomTabSpacing } from '../hooks/useBottomTabSpacing';

export default function PlaceholderScreen({ title }) {
  const { scrollPaddingBottom } = useBottomTabSpacing();

  return (
    <ScreenContainer>
      <View style={styles.phone}>
        <TopNavbar />
        <View style={[styles.content, { paddingBottom: scrollPaddingBottom }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>Cette page mobile sera bientot developpee.</Text>
        </View>
        <BottomTabBar />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  phone: {
    backgroundColor: '#ffffff',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  text: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
