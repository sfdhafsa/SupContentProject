import { Link, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ScreenContainer from '../src/components/ScreenContainer';
import { resendVerificationEmail } from '../src/services/authApi';

const firstParam = (value) => Array.isArray(value) ? value[0] : value;

export default function VerificationPending() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(firstParam(params.email) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const resend = async () => {
    const normalizedEmail = email.trim();
    setError('');
    setFeedback('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Saisissez une adresse e-mail valide.');
      return;
    }

    setLoading(true);
    try {
      const response = await resendVerificationEmail(normalizedEmail);
      setFeedback(response.message || 'Un nouvel e-mail a ete envoye.');
    } catch (requestError) {
      setError(requestError.message || "Impossible de renvoyer l'e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#f8fafc">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>@</Text>
          </View>
          <Text style={styles.title}>Verifiez votre e-mail</Text>
          <Text style={styles.subtitle}>
            Nous avons envoye un lien valable 24 heures. Ouvrez-le pour activer votre compte.
          </Text>

          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#7f8a9b"
            style={styles.input}
            value={email}
          />

          {feedback ? <Text style={styles.success}>{feedback}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={loading}
            onPress={resend}
            style={[styles.button, loading && styles.disabled]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Envoi...' : "Renvoyer l'e-mail"}
            </Text>
          </Pressable>

          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.loginLink}>Retour a la connexion</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 20,
    width: 56,
  },
  iconText: {
    color: '#ef0d1a',
    fontSize: 25,
    fontWeight: '800',
  },
  title: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    borderColor: '#d6dae1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  success: {
    color: '#047857',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  loginLink: {
    color: '#ef0d1a',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    textAlign: 'center',
  },
});
