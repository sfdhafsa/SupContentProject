import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LogoMark from './LogoMark';
import useAuthSession from '../hooks/useAuthSession';
import { clearAuthSession } from '../services/authStorage';

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

function BellIcon() {
  return (
    <View style={styles.bellIcon}>
      <View style={styles.bellTop} />
      <View style={styles.bellDot} />
    </View>
  );
}

export default function TopNavbar({ username = 'User' }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const [sessionOverride, setSessionOverride] = useState(null);
  const authed = sessionOverride ?? isAuthenticated;
  const initial = username.slice(0, 1).toUpperCase();

  useEffect(() => {
    setSessionOverride(null);
  }, [isAuthenticated]);

  const handleAuthPress = async () => {
    if (authed) {
      await clearAuthSession();
      setSessionOverride(false);
      router.replace('/discover');
      return;
    }

    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <LogoMark size={20} radius={7} />
        <Text style={styles.brandText}>SUPMOVIES</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={() => router.push('/discover')}>
          <SearchIcon />
        </Pressable>
        {authed && (
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <BellIcon />
          </Pressable>
        )}
        <Pressable
          style={authed ? styles.authButton : styles.signInButton}
          onPress={handleAuthPress}
        >
          <Text style={authed ? styles.authButtonText : styles.signInButtonText}>
            {authed ? 'Sortir' : 'Sign in'}
          </Text>
        </Pressable>
        {authed && (
          <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#eef0f3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  brandText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  authButton: {
    alignItems: 'center',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  authButtonText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  searchIcon: {
    height: 18,
    position: 'relative',
    width: 18,
  },
  searchCircle: {
    borderColor: '#111827',
    borderRadius: 5,
    borderWidth: 1.4,
    height: 9,
    left: 3,
    position: 'absolute',
    top: 3,
    width: 9,
  },
  searchHandle: {
    backgroundColor: '#111827',
    borderRadius: 1,
    height: 6,
    left: 11,
    position: 'absolute',
    top: 11,
    transform: [{ rotate: '-45deg' }],
    width: 1.4,
  },
  bellIcon: {
    height: 18,
    position: 'relative',
    width: 18,
  },
  bellTop: {
    borderColor: '#111827',
    borderRadius: 7,
    borderWidth: 1.4,
    height: 11,
    left: 4,
    position: 'absolute',
    top: 3,
    width: 10,
  },
  bellDot: {
    backgroundColor: '#111827',
    borderRadius: 2,
    height: 4,
    left: 7,
    position: 'absolute',
    top: 14,
    width: 4,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
});