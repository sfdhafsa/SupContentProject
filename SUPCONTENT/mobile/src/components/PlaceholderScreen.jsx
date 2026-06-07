import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import BottomTabBar from './BottomTabBar';
import TopNavbar from './TopNavbar';

export default function PlaceholderScreen({ title, titleKey }) {
  const { t } = useI18n();

  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <TopNavbar />
        <View style={styles.content}>
          <Text style={styles.title}>{titleKey ? t(titleKey) : title}</Text>
          <Text style={styles.text}>{t('mobilePageComing')}</Text>
        </View>
        <BottomTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  phone: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    height: 592,
    maxWidth: 315,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
