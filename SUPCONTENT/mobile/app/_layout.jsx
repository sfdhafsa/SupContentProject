import { Stack } from 'expo-router';
import { I18nProvider } from '../src/i18n';

export default function RootLayout() {
  return (
    <I18nProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="home" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </I18nProvider>
  );
}
