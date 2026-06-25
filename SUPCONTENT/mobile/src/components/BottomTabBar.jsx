import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useAuthSession from '../hooks/useAuthSession';
import { useBottomTabSpacing } from '../hooks/useBottomTabSpacing';

const publicTabs = [
  { label: 'Explore', route: '/discover', icon: 'search' },
  { label: 'Lists', route: '/lists', icon: 'library' },
  { label: 'Sign in', route: '/login', icon: 'signin' },
];

const privateTabs = [
  { label: 'Home', route: '/home', icon: 'home' },
  { label: 'Explore', route: '/discover', icon: 'search' },
  { label: 'Library', route: '/library', icon: 'library' },
  { label: 'Profile', route: '/profile', icon: 'profile' },
];

const adminTab = {
  label: 'Admin',
  route: '/admin-view',
  icon: 'admin',
};

function getPrivateTabs(user) {
  const roles = (user?.roles || []).map((role) => String(role).toLowerCase());
  return roles.includes('admin') ? [...privateTabs, adminTab] : privateTabs;
}

function isActiveRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function ShieldIcon({ color }) {
  return (
    <View style={styles.shieldIcon}>
      <View style={[styles.shieldBody, { borderColor: color }]} />
      <View style={[styles.shieldCheckStem, { backgroundColor: color }]} />
      <View style={[styles.shieldCheckArm, { backgroundColor: color }]} />
    </View>
  );
}

function TabIcon({ type, active, inactiveColor }) {
  const color = active ? '#ef0d1a' : inactiveColor;
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
      {type === 'signin' && (
        <View style={styles.authIcon}>
          <View style={[styles.authDoor, { borderColor: color }]} />
          <View style={[styles.authArrow, { borderColor: color }]} />
        </View>
      )}
      {type === 'admin' && <ShieldIcon color={color} />}
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
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthSession();
  const { colors } = useTheme();
  const { bottomInset, tabBarHeight } = useBottomTabSpacing(0);
  const tabs = isAuthenticated ? getPrivateTabs(user) : publicTabs;

  const handlePress = async (tab) => {
    router.push(tab.route);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: tabBarHeight,
        paddingBottom: Math.max(bottomInset, 8),
      },
    ]}>
      {tabs.map((tab) => {
        const isActive = isActiveRoute(pathname, tab.route);

        return (
          <Pressable key={tab.route} onPress={() => handlePress(tab)} style={styles.tab}>
            <View style={styles.iconSlot}>
              <TabIcon type={tab.icon} active={isActive} inactiveColor={colors.subtle} />
            </View>
            <Text style={[styles.label, { color: colors.subtle }, isActive && styles.activeLabel]}>{tab.label}</Text>
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
    justifyContent: 'space-around',
    left: 0,
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
  shieldIcon: {
    height: 21,
    marginLeft: 3,
    marginTop: 1,
    position: 'relative',
    width: 19,
  },
  shieldBody: {
    borderRadius: 5,
    borderWidth: 1.5,
    height: 17,
    left: 2,
    position: 'absolute',
    top: 1,
    transform: [{ rotate: '45deg' }],
    width: 15,
  },
  shieldCheckStem: {
    borderRadius: 1,
    height: 7,
    left: 9,
    position: 'absolute',
    top: 8,
    transform: [{ rotate: '45deg' }],
    width: 1.5,
  },
  shieldCheckArm: {
    borderRadius: 1,
    height: 1.5,
    left: 6,
    position: 'absolute',
    top: 11,
    transform: [{ rotate: '45deg' }],
    width: 5,
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
