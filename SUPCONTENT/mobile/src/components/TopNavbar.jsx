import { Pressable, StyleSheet, Text, View } from 'react-native';
import LogoMark from './LogoMark';

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
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <LogoMark size={20} radius={7} />
        <Text style={styles.brandText}>SUPMOVIES</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton}>
          <SearchIcon />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <BellIcon />
        </Pressable>
        <Pressable style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
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
    height: 42,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  brandText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
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
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  avatarText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
});
