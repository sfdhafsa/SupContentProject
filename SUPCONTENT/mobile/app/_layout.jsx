import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TopNavbar from '../src/components/TopNavbar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import useAuthSession, { AuthSessionProvider } from '../src/hooks/useAuthSession';
import { NotificationBadgeProvider } from '../src/hooks/useNotificationBadge';
import { UnreadChatBadgeProvider } from '../src/hooks/useUnreadChatBadge';

const authOnlyPrefixes = ['/login', '/register', '/forgot-password', '/reset-password'];
const protectedPrefixes = ['/home', '/profile', '/settings', '/notifications', '/messages', '/conversation', '/admin-view'];
const routesWithOwnTopNavbar = [
  '/home',
  '/discover',
  '/dashboard',
  '/library',
  '/lists',
  '/messages',
  '/notifications',
  '/profile',
  '/admin-view',
];

function hasRoutePrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function RootNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated } = useAuthSession();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (pathname === '/') {
      router.replace(isAuthenticated ? '/home' : '/discover');
      return;
    }

    if (!isAuthenticated && hasRoutePrefix(pathname, protectedPrefixes)) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && hasRoutePrefix(pathname, authOnlyPrefixes)) {
      router.replace('/home');
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color="#ef0d1a" />
      </View>
    );
  }

  const showLayoutTopNavbar =
    pathname !== '/' &&
    !hasRoutePrefix(pathname, authOnlyPrefixes) &&
    pathname !== '/auth/callback' &&
    !hasRoutePrefix(pathname, routesWithOwnTopNavbar);

  return (
    <View style={[styles.navigator, { backgroundColor: colors.page }]}>
      {showLayoutTopNavbar ? <TopNavbar /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="home" />
        <Stack.Screen name="discover" />
        <Stack.Screen name="library" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="conversation/[userId]" />
        <Stack.Screen name="list/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="admin-view" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="publicProfile" />
        <Stack.Screen name="movie/[id]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <ThemeProvider>
          <NotificationBadgeProvider>
            <UnreadChatBadgeProvider>
              <RootNavigator />
            </UnreadChatBadgeProvider>
          </NotificationBadgeProvider>
        </ThemeProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  navigator: {
    flex: 1,
  },
  loadingPage: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
  },
});
