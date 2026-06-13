import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray100:'#f3f4f6',
  gray200:'#e5e7eb',
  gray400:'#9ca3af',
};

function SearchIcon({ color = C.black }) {
  return (
    <View style={{ width: 20, height: 20, position: 'relative' }}>
      <View style={{
        position: 'absolute',
        top: 2,
        left: 2,
        width: 12,
        height: 12,
        borderRadius: 7,
        borderWidth: 1.8,
        borderColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 13,
        left: 13,
        width: 6,
        height: 1.8,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute',
        top: 5,
        left: 5,
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: color,
        opacity: 0.18,
      }} />
    </View>
  );
}

function BellIcon({ color = C.black }) {
  return (
    <View style={{ width: 20, height: 20, position: 'relative' }}>
      <View style={{
        position: 'absolute',
        top: 3,
        left: 4,
        width: 12,
        height: 12,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        borderWidth: 1.6,
        borderColor: color,
        borderBottomWidth: 0,
      }} />
      <View style={{
        position: 'absolute',
        top: 14,
        left: 3,
        width: 14,
        height: 1.6,
        borderRadius: 1,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 16,
        left: 8,
        width: 4,
        height: 2,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        borderBottomWidth: 1.6,
        borderColor: color,
      }} />
    </View>
  );
}

function ChatIcon({ color = C.black }) {
  return (
    <View style={{ width: 18, height: 18, position: 'relative' }}>
      <View style={{
        position: 'absolute', top: 3, left: 2,
        width: 14, height: 11, borderRadius: 5,
        borderWidth: 1.5, borderColor: color,
      }} />
      <View style={{
        position: 'absolute', top: 13, left: 5,
        width: 0, height: 0,
        borderTopWidth: 4,
        borderTopColor: color,
        borderRightWidth: 4,
        borderRightColor: 'transparent',
      }} />
    </View>
  );
}

export default function TopNavbar({ username = 'User', onSearch }) {
  const router                        = useRouter();
  const { isAuthenticated, user }     = useAuthSession();
  const { unreadCount }                = useNotificationBadge();
  const authed                        = isAuthenticated;
  const displayUsername               = user?.username || username || 'User';
  const initial                       = displayUsername.slice(0, 1).toUpperCase();

  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim                     = useRef(new Animated.Value(0)).current;
  const inputRef                      = useRef(null);

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
              onPress={() => router.push('/messages')}
              hitSlop={8}
            >
              <ChatIcon />
            </Pressable>
          )}

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

          {!authed && (
            <Pressable
              style={styles.signInBtn}
              onPress={() => router.push('/login')}
              hitSlop={4}
            >
              <Text style={styles.signInTxt}>Sign in</Text>
            </Pressable>
          )}

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
