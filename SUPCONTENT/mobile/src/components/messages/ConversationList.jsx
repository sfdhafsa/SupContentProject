import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ConversationItem from './ConversationItem';

export default function ConversationList({
  conversations,
  loading,
  refreshing,
  error,
  onRefresh,
}) {
  const router = useRouter();

  const getOtherUser = (conversation) => conversation.other_user || {
    id: conversation.other_user_id,
    username: conversation.other_username,
    avatar_url: conversation.other_avatar_url,
  };

  if (loading && conversations.length === 0) {
    return <ActivityIndicator size="small" color="#ef0d1a" style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Impossible de charger les messages</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item, index) => String(getOtherUser(item)?.id || index)}
      renderItem={({ item }) => {
        const otherUser = getOtherUser(item);

        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/conversation/[userId]',
                params: {
                  userId: otherUser?.id,
                  username: otherUser?.username,
                },
              })
            }
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          >
            <ConversationItem conversation={item} />
          </Pressable>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucune conversation pour l'instant.</Text>
          <Text style={styles.emptySubText}>
            Suivez mutuellement un utilisateur pour lui envoyer un message.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 24,
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  pressable: {
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.75,
  },
  separator: {
    height: 6,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  errorText: {
    color: '#ef0d1a',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
});
