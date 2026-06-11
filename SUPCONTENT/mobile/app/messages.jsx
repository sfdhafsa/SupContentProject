import { StyleSheet, Text, TextInput, View } from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import ConversationList from '../src/components/messages/ConversationList';
import { useMessages } from '../src/hooks/useMessages';
import { useState } from 'react';

export default function Messages() {
  const { conversations, loading, refreshing, error, refresh } = useMessages();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.other_user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <TopNavbar />

        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.listContainer}>
          <ConversationList
            conversations={filtered}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={refresh}
          />
        </View>

        <BottomTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  phone: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    height: 592,
    maxWidth: 315,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    marginBottom: 6,
    marginHorizontal: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchIcon: {
    height: 14,
    position: 'relative',
    width: 14,
  },
  searchCircle: {
    borderColor: '#9ca3af',
    borderRadius: 4,
    borderWidth: 1.3,
    height: 8,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 8,
  },
  searchHandle: {
    backgroundColor: '#9ca3af',
    borderRadius: 1,
    height: 5,
    left: 9,
    position: 'absolute',
    top: 9,
    transform: [{ rotate: '-45deg' }],
    width: 1.3,
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    fontSize: 10,
  },
  listContainer: {
    flex: 1,
    marginBottom: 58,
  },
});
