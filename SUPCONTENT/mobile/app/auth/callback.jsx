import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCurrentUser } from '../../src/services/authApi';
import { saveAuthSession } from '../../src/services/authStorage';
import { useI18n } from '../../src/i18n';

export default function OAuthCallback() {
  const router = useRouter();
  const { t } = useI18n();
  const { token, error: oauthError } = useLocalSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishOAuth = async () => {
      if (oauthError) {
        setError(t('googleFailed'));
        return;
      }

      if (!token) {
        setError(t('missingOauthToken'));
        return;
      }

      try {
        const user = await getCurrentUser(token);
        await saveAuthSession(token, user);
        router.replace('/home');
      } catch {
        setError(t('googleProfileFailed'));
      }
    };

    finishOAuth();
  }, [oauthError, router, t, token]);

  return (
    <View style={styles.page}>
      {error ? (
        <>
          <Text style={styles.title}>{t('connectionFailed')}</Text>
          <Text style={styles.text}>{error}</Text>
          <Link href="/login" style={styles.link}>{t('backToLogin')}</Link>
        </>
      ) : (
        <>
          <View style={styles.spinner} />
          <Text style={styles.text}>{t('connectingGoogle')}</Text>
        </>
      )}
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
  spinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#fecdd3',
    borderTopColor: '#ef0d1a',
    marginBottom: 16,
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
    textAlign: 'center',
  },
  link: {
    color: '#ef0d1a',
    fontWeight: '700',
  },
});
