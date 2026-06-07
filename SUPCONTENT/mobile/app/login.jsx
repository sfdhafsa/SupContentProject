import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
      setError('Email and password are required.');
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
      setSuccess(`Connected as ${data.user?.username || data.user?.email || 'user'}.`);
      router.replace('/home');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.phone}>
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

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue</Text>

        <View style={styles.socialRow}>
          <Pressable onPress={startGoogleOAuth} style={styles.socialButton}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.label}>Email</Text>
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
          <Text style={styles.label}>Password</Text>
          <Link href="/forgot-password" asChild>
            <Pressable>
              <Text style={styles.forgotText}>Forgot?</Text>
            </Pressable>
          </Link>
        </View>

        <TextInput
          onChangeText={(value) => updateField('password', value)}
          placeholder="Enter your password"
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
          <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </Pressable>

        <View style={styles.signUpRow}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.signUpText}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  phone: {
    width: '100%',
    maxWidth: 315,
    minHeight: 505,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 42,
    paddingBottom: 24,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ef0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
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
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#5f6b7a',
    fontSize: 12,
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
    height: 25,
    borderWidth: 1,
    borderColor: '#d6dae1',
    borderRadius: 6,
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
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 25,
    borderWidth: 1,
    borderColor: '#d6dae1',
    borderRadius: 7,
    color: '#111827',
    fontSize: 12,
    paddingHorizontal: 10,
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
    height: 29,
    borderRadius: 7,
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
    fontSize: 11,
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
