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
import { useTheme } from '../src/context/ThemeContext';
import { registerWithEmail } from '../src/services/authApi';
import { saveAuthSession } from '../src/services/authStorage';
import { startGoogleOAuth } from '../src/services/oauth';

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme();
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
    if (form.username.trim().length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caracteres.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Saisissez une adresse e-mail valide.';
    if (form.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres.';
    if (!/[A-Z]/.test(form.password)) return 'Le mot de passe doit contenir au moins une majuscule.';
    if (!/[0-9]/.test(form.password)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
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
      setError(err.message || 'Impossible de creer le compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor={colors.bg}>
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

        <Text style={[styles.title, { color: colors.text }]}>Creer un compte</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Inscrivez-vous pour commencer avec SUPMOVIES</Text>

        <Pressable onPress={startGoogleOAuth} style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.googleIcon, { color: colors.text }]}>G</Text>
          <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.subtle }]}>OU</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Nom d'utilisateur</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => updateField('username', value)}
          placeholder="moviefan123"
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
          value={form.username}
        />

        <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(value) => updateField('email', value)}
          placeholder="name@example.com"
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
          value={form.email}
        />

        <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
        <TextInput
          onChangeText={(value) => updateField('password', value)}
          placeholder="Creer un mot de passe (8 caracteres min.)"
          placeholderTextColor={colors.subtle}
          secureTextEntry
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
          value={form.password}
        />

        <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
        <TextInput
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder="Confirmez votre mot de passe"
          placeholderTextColor={colors.subtle}
          secureTextEntry
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
          value={form.confirmPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          disabled={loading}
          onPress={handleRegister}
          style={[styles.createButton, loading && styles.disabledButton]}
        >
          <Text style={styles.createText}>{loading ? 'Creation...' : 'Creer un compte'}</Text>
        </Pressable>

        <View style={styles.signInRow}>
          <Text style={[styles.mutedText, { color: colors.muted }]}>Vous avez deja un compte ? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.signInText}>Se connecter</Text>
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
    paddingVertical: 28,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ef0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 26,
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
    marginBottom: 14,
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
    marginBottom: 12,
  },
  createButton: {
    minHeight: 52,
    borderRadius: 12,
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
