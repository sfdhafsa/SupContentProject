import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerWithEmail } from '../src/services/authApi';
import { saveAuthSession } from '../src/services/authStorage';
import { useI18n } from '../src/i18n';
import { startGoogleOAuth } from '../src/services/oauth';

export default function Register() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (form.username.trim().length < 3) return t('usernameValidation');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return t('emailValidation');
    if (form.password.length < 8) return t('passwordLengthValidation');
    if (!/[A-Z]/.test(form.password)) return t('passwordUppercaseValidation');
    if (!/[0-9]/.test(form.password)) return t('passwordNumberValidation');
    if (form.password !== form.confirmPassword) return t('passwordsMatchValidation');
    return '';
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await registerWithEmail({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      await saveAuthSession(data.token, data.user);
      router.replace('/home');
    } catch (err) {
      setError(err.message || t('unableCreateAccount'));
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

        <Text style={styles.title}>{t('createAccount')}</Text>
        <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>

        <Pressable onPress={startGoogleOAuth} style={styles.socialButton}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('or')}</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.label}>{t('username')}</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => updateField('username', value)}
          placeholder="moviefan123"
          placeholderTextColor="#7f8a9b"
          style={styles.input}
          value={form.username}
        />

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(value) => updateField('email', value)}
          placeholder="name@example.com"
          placeholderTextColor="#7f8a9b"
          style={styles.input}
          value={form.email}
        />

        <Text style={styles.label}>{t('password')}</Text>
        <TextInput
          onChangeText={(value) => updateField('password', value)}
          placeholder={t('createPasswordPlaceholder')}
          placeholderTextColor="#7f8a9b"
          secureTextEntry
          style={styles.input}
          value={form.password}
        />

        <Text style={styles.label}>{t('confirmPassword')}</Text>
        <TextInput
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder={t('confirmPasswordPlaceholder')}
          placeholderTextColor="#7f8a9b"
          secureTextEntry
          style={styles.input}
          value={form.confirmPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          disabled={loading}
          onPress={handleRegister}
          style={[styles.createButton, loading && styles.disabledButton]}
        >
          <Text style={styles.createText}>{loading ? t('creating') : t('createAccount')}</Text>
        </Pressable>

        <View style={styles.signInRow}>
          <Text style={styles.mutedText}>{t('alreadyHaveAccount')}</Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.signInText}>{t('signIn')}</Text>
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
    minHeight: 580,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 66,
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
    marginBottom: 14,
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
    marginBottom: 12,
  },
  createButton: {
    height: 29,
    borderRadius: 7,
    backgroundColor: '#ef0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 13,
  },
  disabledButton: {
    opacity: 0.65,
  },
  createText: {
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
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: '#6b7280',
    fontSize: 10,
  },
  signInText: {
    color: '#ef0d1a',
    fontSize: 10,
    fontWeight: '800',
  },
});
