import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import useAuthSession from '../hooks/useAuthSession';
import { clearAuthSession } from '../services/authStorage';

const publicTabs = [
  { label: 'Decouvrir', route: '/discover', icon: 'search' },
  { label: 'Listes', route: '/library', icon: 'library' },
  { label: 'Sign in', route: '/login', icon: 'signin' },
];

const privateTabs = [
  { label: 'Accueil', route: '/home', icon: 'home' },
  { label: 'Decouvrir', route: '/discover', icon: 'search' },
  { label: 'Bibliotheque', route: '/library', icon: 'library' },
  { label: 'Profil', route: '/profile', icon: 'profile' },
  { label: 'Sortir', action: 'logout', icon: 'logout' },
];

function TabIcon({ type, active }) {
  const color = active ? '#ef0d1a' : '#9ca3af';

  return (
    <View>
      {type === 'home' && <View style={[styles.homeIcon, { borderColor: color }]} />}

      {type === 'search' && (
        <View style={styles.searchWrap}>
          <View style={[styles.searchCircle, { borderColor: color }]} />
          <View style={[styles.searchHandle, { backgroundColor: color }]} />
        </View>
      )}

      {type === 'library' && (
        <View style={styles.libraryWrap}>
          <View style={[styles.libraryLine, { backgroundColor: color }]} />
          <View style={[styles.libraryLine, { backgroundColor: color }]} />
          <View style={[styles.libraryLine, { backgroundColor: color }]} />
        </View>
      )}
      {type === 'bell' && <View style={[styles.bellIcon, { borderColor: color }]} />}
      {type === 'signin' && (
        <View style={styles.authIcon}>
          <View style={[styles.authDoor, { borderColor: color }]} />
          <View style={[styles.authArrow, { borderColor: color }]} />
        </View>
      )}
      {type === 'logout' && (
        <View style={styles.authIcon}>
          <View style={[styles.authDoor, { borderColor: color }]} />
          <View style={[styles.logoutArrow, { borderColor: color }]} />
        </View>
      )}
      {type === 'profile' && (
        <View style={styles.profileWrap}>
          <View style={[styles.profileHead, { borderColor: color }]} />
          <View style={[styles.profileBody, { borderColor: color }]} />
        </View>
      )}
    </View>
  );
}

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthSession();
  const [sessionOverride, setSessionOverride] = useState(null);
  const authed = sessionOverride ?? isAuthenticated;
  const tabs = authed ? privateTabs : publicTabs;

  useEffect(() => {
    setSessionOverride(null);
  }, [isAuthenticated]);

  const handlePress = async (tab) => {
    if (tab.action === 'logout') {
      await clearAuthSession();
      setSessionOverride(false);
      router.replace('/discover');
      return;
    }

    router.push(tab.route);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.route && pathname === tab.route || pathname.startsWith('/conversation');

        // Only highlight chat tab for conversation routes
        const isActive =
          tab.route === '/messages'
            ? pathname === '/messages' || pathname.startsWith('/conversation')
            : pathname === tab.route;

        return (
          <Pressable key={tab.route || tab.action} onPress={() => handlePress(tab)} style={styles.tab}>
            <View style={styles.iconSlot}>
              <TabIcon type={tab.icon} active={isActive} />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    height: 66,
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 8,
    paddingTop: 6,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minHeight: 48,
    justifyContent: 'center',
  },
  iconSlot: {
    height: 22,
    position: 'relative',
    width: 24,
  },
  label: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#ef0d1a',
  },
  homeIcon: {
    borderRadius: 3,
    borderWidth: 1.4,
    height: 13,
    marginLeft: 5,
    marginTop: 5,
    transform: [{ rotate: '45deg' }],
    width: 13,
  },
  searchWrap: {
    height: 20,
    position: 'relative',
    width: 20,
  },
  searchCircle: {
    borderRadius: 6,
    borderWidth: 1.5,
    height: 11,
    left: 3,
    position: 'absolute',
    top: 3,
    width: 11,
  },
  searchHandle: {
    borderRadius: 1,
    height: 7,
    left: 13,
    position: 'absolute',
    top: 13,
    transform: [{ rotate: '-45deg' }],
    width: 1.5,
  },
  libraryWrap: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 4,
    marginTop: 5,
  },
  libraryLine: {
    borderRadius: 1,
    height: 14,
    width: 2,
  },

  // Chat bubble icon
  chatWrap: {
    height: 20,
    marginLeft: 2,
    marginTop: 2,
    position: 'relative',
    width: 20,
  },
  chatBubble: {
    borderRadius: 8,
    borderWidth: 1.5,
    height: 13,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 18,
  },
  chatTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    borderRightColor: 'transparent',
    borderRightWidth: 0,
    borderTopWidth: 4,
    bottom: 2,
    height: 0,
    left: 4,
    position: 'absolute',
    width: 0,
  },
  chatDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    left: 5,
    position: 'absolute',
    top: 5,
  },
  chatDot: {
    borderRadius: 1.5,
    height: 3,
    width: 3,
  },

  authIcon: {
    height: 20,
    marginLeft: 3,
    marginTop: 3,
    position: 'relative',
    width: 20,
  },
  authDoor: {
    borderRadius: 3,
    borderWidth: 1.4,
    height: 14,
    left: 1,
    position: 'absolute',
    top: 2,
    width: 10,
  },
  authArrow: {
    borderRightWidth: 1.6,
    borderTopWidth: 1.6,
    height: 7,
    position: 'absolute',
    right: 1,
    top: 6,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  logoutArrow: {
    borderLeftWidth: 1.6,
    borderTopWidth: 1.6,
    height: 7,
    position: 'absolute',
    right: 1,
    top: 6,
    transform: [{ rotate: '-45deg' }],
    width: 7,
  },
  profileWrap: {
    alignItems: 'center',
    marginTop: 3,
  },
  profileHead: {
    borderRadius: 4,
    borderWidth: 1.4,
    height: 8,
    width: 8,
  },
  profileBody: {
    borderRadius: 8,
    borderWidth: 1.4,
    height: 8,
    marginTop: 1,
    width: 15,
  },
});
