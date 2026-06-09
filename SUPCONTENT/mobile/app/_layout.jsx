import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="home" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="conversation/[userId]" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
