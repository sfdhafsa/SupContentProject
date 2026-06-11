import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ScreenContainer from '../src/components/ScreenContainer';
import { loginWithEmail } from '../src/services/authApi';
import { saveAuthSession } from '../src/services/authStorage';
import { startGoogleOAuth } from '../src/services/oauth';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      setError("L'e-mail et le mot de passe sont requis.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await loginWithEmail({
        email: form.email.trim(),
        password: form.password,
      });

      await saveAuthSession(data.token, data.user);
      setSuccess(`Connecte en tant que ${data.user?.username || data.user?.email || 'user'}.`);
      router.replace('/home');
    } catch (err) {
      setError(err.message || 'Impossible de se connecter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#f8fafc">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.phone}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.logo}>
          <View style={styles.logoGrid}>
            <View style={styles.logoCell} />
            <View style={styles.logoCell} />
            <View style={styles.logoCell} />
            <View style={styles.logoCell} />
            <View style={styles.logoCell} />
            <View style={styles.logoCell} />
          </View>
        </View>

        <Text style={styles.title}>Bon retour</Text>
        <Text style={styles.subtitle}>Connectez-vous a votre compte pour continuer</Text>

        <View style={styles.socialRow}>
          <Pressable onPress={startGoogleOAuth} style={styles.socialButton}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(value) => updateField('email', value)}
          placeholder="name@example.com"
          placeholderTextColor="#7f8a9b"
          style={styles.input}
          value={form.email}
        />

        <View style={styles.passwordHeader}>
          <Text style={styles.label}>Mot de passe</Text>
          <Link href="/forgot-password" asChild>
            <Pressable>
              <Text style={styles.forgotText}>Oublie ?</Text>
            </Pressable>
          </Link>
        </View>

        <TextInput
          onChangeText={(value) => updateField('password', value)}
          placeholder="Saisissez votre mot de passe"
          placeholderTextColor="#7f8a9b"
          secureTextEntry
          style={styles.input}
          value={form.password}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable
          disabled={loading}
          onPress={handleLogin}
          style={[styles.signInButton, loading && styles.disabledButton]}
        >
          <Text style={styles.signInText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </Pressable>

        <View style={styles.signUpRow}>
          <Text style={styles.mutedText}>Vous n'avez pas de compte ? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.signUpText}>S'inscrire</Text>
            </Pressable>
          </Link>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  phone: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ef0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  logoGrid: {
    width: 17,
    height: 17,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  logoCell: {
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#030712',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#5f6b7a',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 26,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  socialButton: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d6dae1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleIcon: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  socialText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e4e8',
  },
  dividerText: {
    color: '#7b8491',
    fontSize: 9,
    paddingHorizontal: 9,
  },
  label: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d6dae1',
    borderRadius: 12,
    color: '#111827',
    fontSize: 15,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    color: '#ef0d1a',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  signInButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#ef0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.65,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: '#6b7280',
    fontSize: 10,
  },
  signUpText: {
    color: '#ef0d1a',
    fontSize: 10,
    fontWeight: '800',
  },
});
