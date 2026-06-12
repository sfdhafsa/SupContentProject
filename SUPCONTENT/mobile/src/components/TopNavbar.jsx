import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LogoMark from './LogoMark';
import useAuthSession from '../hooks/useAuthSession';
import useNotificationBadge from '../hooks/useNotificationBadge';
import { clearAuthSession } from '../services/authStorage';

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray100:'#f3f4f6',
  gray200:'#e5e7eb',
  gray400:'#9ca3af',
  gray700:'#374151',
};

function SearchIcon({ color = C.black }) {
  return (
    <View style={{ width: 18, height: 18, position: 'relative' }}>
      <View style={{
        position: 'absolute', top: 2, left: 2,
        width: 10, height: 10, borderRadius: 5,
        borderWidth: 1.6, borderColor: color,
      }} />
      <View style={{
        position: 'absolute', top: 10, left: 10,
        width: 6, height: 1.6, borderRadius: 1,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function BellIcon({ color = C.black }) {
  return (
    <View style={{ width: 18, height: 18, position: 'relative' }}>
      <View style={{
        position: 'absolute', top: 2, left: 3,
        width: 11, height: 11, borderRadius: 6,
        borderWidth: 1.5, borderColor: color,
      }} />
      <View style={{
        position: 'absolute', top: 13, left: 6,
        width: 5, height: 5, borderRadius: 2.5,
        backgroundColor: color,
      }} />
    </View>
  );
}

export default function TopNavbar({ username = 'User', onSearch }) {
  const router                        = useRouter();
  const { isAuthenticated }           = useAuthSession();
  const { unreadCount }                = useNotificationBadge();
  const [sessionOverride, setSessionOverride] = useState(null);
  const authed                        = sessionOverride ?? isAuthenticated;
  const initial                       = username.slice(0, 1).toUpperCase();

  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim                     = useRef(new Animated.Value(0)).current;
  const inputRef                      = useRef(null);

  useEffect(() => { setSessionOverride(null); }, [isAuthenticated]);

  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    inputRef.current?.blur();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(() => {
      setSearchOpen(false);
      setSearchQuery('');
      onSearch?.('');
    });
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    onSearch?.(text);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAuthPress = async () => {
    if (authed) {
      await clearAuthSession();
      setSessionOverride(false);
      router.replace('/discover');
      return;
    }
    router.push('/login');
  };

  const searchTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-56, 0],
  });
  const searchOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.wrapper}>
      {/* Main bar */}
      <View style={styles.container}>
        <Pressable onPress={() => router.push('/discover')} style={styles.brand}>
          <LogoMark size={22} radius={7} />
          <Text style={styles.brandText}>SUPMOVIES</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={searchOpen ? closeSearch : openSearch}
            style={[styles.iconBtn, searchOpen && styles.iconBtnActive]}
            hitSlop={8}
          >
            {searchOpen
              ? <Text style={{ color: C.red, fontSize: 18, fontWeight: '700', lineHeight: 22 }}>✕</Text>
              : <SearchIcon />
            }
          </Pressable>

          {authed && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/notifications')}
              hitSlop={8}
            >
              <BellIcon />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}

          <Pressable
            style={authed ? styles.outBtn : styles.signInBtn}
            onPress={handleAuthPress}
            hitSlop={4}
          >
            <Text style={authed ? styles.outTxt : styles.signInTxt}>
              {authed ? 'Sortir' : 'Sign in'}
            </Text>
          </Pressable>

          {authed && (
            <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
              <Text style={styles.avatarTxt}>{initial}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Search bar animée */}
      {searchOpen && (
        <Animated.View style={[
          styles.searchBar,
          { opacity: searchOpacity, transform: [{ translateY: searchTranslateY }] },
        ]}>
          <View style={styles.searchIcon}>
            <SearchIcon color={C.gray400} />
          </View>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Films, utilisateurs, listes..."
            placeholderTextColor={C.gray400}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => { setSearchQuery(''); onSearch?.(''); }}
              hitSlop={8}
              style={{ paddingLeft: 8 }}
            >
              <Text style={{ color: C.gray400, fontSize: 16 }}>✕</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f3',
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: C.black,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.gray100,
  },
  iconBtnActive: {
    backgroundColor: '#fff0f0',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: C.red,
    borderColor: C.white,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  notificationBadgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
  },
  outBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outTxt: {
    color: C.gray700,
    fontSize: 11,
    fontWeight: '700',
  },
  signInBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInTxt: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    color: C.black,
    fontSize: 13,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    height: 46,
    backgroundColor: C.gray100,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.black,
    paddingVertical: 0,
  },
});
