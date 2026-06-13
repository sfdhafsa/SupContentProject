import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import ScreenContainer from '../src/components/ScreenContainer';
import TopNavbar from '../src/components/TopNavbar';
import ConversationList from '../src/components/messages/ConversationList';
import { useMessages } from '../src/hooks/useMessages';
import { searchUsers } from '../src/services/messagesApi';

const RED = '#ef0d1a';
const TEXT = '#111827';
const MUTED = '#6b7280';
const SOFT = '#f3f4f6';
const BORDER = '#e5e7eb';

function MessageIcon() {
  return (
    <View style={styles.emptyIconGlyph}>
      <View style={styles.emptyIconBubble} />
      <View style={styles.emptyIconTail} />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

function EmptyState({ title, text }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MessageIcon />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function getOtherUser(conversation) {
  return conversation.other_user || {
    id: conversation.other_user_id,
    username: conversation.other_username,
    avatar_url: conversation.other_avatar_url,
  };
}

export default function Messages() {
  const router = useRouter();
  const { conversations, loading, refreshing, error, refresh } = useMessages();
  const [search, setSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        (getOtherUser(conversation)?.username || '').toLowerCase().includes(query)
      ),
    [conversations, query]
  );

  useEffect(() => {
    if (query.length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return undefined;
    }

    setSearchingUsers(true);
    const timer = setTimeout(() => {
      searchUsers(query)
        .then(setUserResults)
        .catch(() => setUserResults([]))
        .finally(() => setSearchingUsers(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const openConversation = (user) => {
    if (!user?.id) return;
    router.push({
      pathname: '/conversation/[userId]',
      params: {
        userId: user.id,
        username: user.username || 'Conversation',
      },
    });
  };

  const showSearchResults = query.length >= 2;
  const visibleUserResults = userResults.filter((user) =>
    !conversations.some((conversation) => String(getOtherUser(conversation)?.id) === String(user.id))
  );

  return (
    <ScreenContainer>
      <View style={styles.phone}>
        <TopNavbar />

        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Conversations</Text>
              <Text style={styles.subtitle}>
                Vous pouvez seulement envoyer des messages aux abonnements mutuels
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Messages</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.searchWrap}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un utilisateur"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={styles.clearText}>x</Text>
                </Pressable>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.resultsBox}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Utilisateurs</Text>
                  {searchingUsers ? <ActivityIndicator size="small" color={RED} /> : null}
                </View>

                {!searchingUsers && visibleUserResults.length === 0 ? (
                  <Text style={styles.resultsEmpty}>Aucun nouvel utilisateur trouve.</Text>
                ) : (
                  visibleUserResults.slice(0, 4).map((user) => (
                    <Pressable
                      key={user.id}
                      style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
                      onPress={() => openConversation(user)}
                    >
                      <View style={styles.resultAvatar}>
                        <Text style={styles.resultAvatarText}>
                          {(user.username || '?').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName} numberOfLines={1}>{user.username}</Text>
                        <Text style={styles.resultHint}>Ouvrir la conversation</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}

            <View style={styles.listShell}>
              {loading || error || filtered.length > 0 ? (
                <ConversationList
                  conversations={filtered}
                  loading={loading}
                  refreshing={refreshing}
                  error={error}
                  onRefresh={refresh}
                />
              ) : (
                <EmptyState
                  title="Aucune conversation"
                  text="Rechercher un utilisateur ou une conversation."
                />
              )}
            </View>
          </View>
        </View>

        <BottomTabBar />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  phone: {
    backgroundColor: '#f8fafc',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingBottom: 74,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 250,
  },
  statusPill: {
    backgroundColor: '#ecfdf3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#eef0f3',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 14,
    overflow: 'hidden',
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    height: 15,
    position: 'relative',
    width: 15,
  },
  searchCircle: {
    borderColor: '#9ca3af',
    borderRadius: 5,
    borderWidth: 1.4,
    height: 9,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 9,
  },
  searchHandle: {
    backgroundColor: '#9ca3af',
    borderRadius: 1,
    height: 6,
    left: 10,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '-45deg' }],
    width: 1.4,
  },
  searchInput: {
    color: TEXT,
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '800',
  },
  resultsBox: {
    borderBottomColor: '#eef0f3',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultsTitle: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resultsEmpty: {
    color: '#9ca3af',
    fontSize: 12,
    paddingVertical: 10,
  },
  resultRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.72,
  },
  resultAvatar: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  resultAvatarText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '900',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  resultHint: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  listShell: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    marginBottom: 12,
    width: 46,
  },
  emptyIconGlyph: {
    height: 22,
    position: 'relative',
    width: 22,
  },
  emptyIconBubble: {
    borderColor: '#9ca3af',
    borderRadius: 7,
    borderWidth: 1.5,
    height: 15,
    left: 2,
    position: 'absolute',
    top: 3,
    width: 18,
  },
  emptyIconTail: {
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    borderTopColor: '#9ca3af',
    borderTopWidth: 5,
    height: 0,
    left: 6,
    position: 'absolute',
    top: 17,
    width: 0,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 260,
    textAlign: 'center',
  },
});
