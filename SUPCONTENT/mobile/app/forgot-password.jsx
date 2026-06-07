import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../src/i18n';

export default function ForgotPassword() {
  const { t } = useI18n();

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t('forgotPassword')}</Text>
      <Text style={styles.text}>{t('resetComing')}</Text>
      <Link href="/login" style={styles.link}>{t('backToLogin')}</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
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
    marginBottom: 18,
  },
  link: {
    color: '#ef0d1a',
    fontWeight: '700',
  },
});
