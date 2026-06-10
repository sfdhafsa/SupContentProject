import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const tabs = [
  { label: 'Accueil', route: '/home', icon: 'home' },
  { label: 'Decouvrir', route: '/discover', icon: 'search' },
  { label: 'Bibliotheque', route: '/library', icon: 'library' },
  { label: 'Chat', route: '/messages', icon: 'chat' },
  { label: 'Profil', route: '/profile', icon: 'profile' },
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

      {type === 'chat' && (
        <View style={styles.chatWrap}>
          {/* Bubble body */}
          <View style={[styles.chatBubble, { borderColor: color }]} />
          {/* Tail */}
          <View style={[styles.chatTail, { borderTopColor: color }]} />
          {/* Dots inside bubble */}
          <View style={styles.chatDots}>
            <View style={[styles.chatDot, { backgroundColor: color }]} />
            <View style={[styles.chatDot, { backgroundColor: color }]} />
            <View style={[styles.chatDot, { backgroundColor: color }]} />
          </View>
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

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = pathname === tab.route || pathname.startsWith('/conversation');

        // Only highlight chat tab for conversation routes
        const isActive =
          tab.route === '/messages'
            ? pathname === '/messages' || pathname.startsWith('/conversation')
            : pathname === tab.route;

        return (
          <Pressable key={tab.route} onPress={() => router.push(tab.route)} style={styles.tab}>
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
    height: 58,
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 4,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  iconSlot: {
    height: 22,
    position: 'relative',
    width: 24,
  },
  label: {
    color: '#9ca3af',
    fontSize: 9,
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
