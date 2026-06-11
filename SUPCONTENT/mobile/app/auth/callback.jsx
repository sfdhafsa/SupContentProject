import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCurrentUser } from '../../src/services/authApi';
import { saveAuthSession } from '../../src/services/authStorage';

const firstParam = (value) => Array.isArray(value) ? value[0] : value;

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = firstParam(params.token);
  const oauthError = firstParam(params.error);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const finishOAuth = async () => {
      if (oauthError) {
        if (mounted) setError('La connexion Google a echoue.');
        return;
      }

      if (!token) {
        if (mounted) setError('Jeton OAuth manquant.');
        return;
      }

      try {
        const user = await getCurrentUser(token);
        await saveAuthSession(token, user);
        if (mounted) router.replace('/profile');
      } catch (callbackError) {
        if (!mounted) return;
        setError(
          callbackError?.code === 'NETWORK_ERROR'
            ? 'Le compte Google est connecte, mais le serveur est inaccessible.'
            : 'Impossible de charger votre profil Google.'
        );
      }
    };

    finishOAuth();

    return () => {
      mounted = false;
    };
  }, [oauthError, router, token]);

  return (
    <View style={styles.page}>
      {error ? (
        <>
          <Text style={styles.title}>Connexion echouee</Text>
          <Text style={styles.text}>{error}</Text>
          <Link href="/login" style={styles.link}>Retour a la connexion</Link>
        </>
      ) : (
        <>
          <View style={styles.spinner} />
          <Text style={styles.text}>Connexion avec Google...</Text>
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
