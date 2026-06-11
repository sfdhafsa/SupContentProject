import { Image, StyleSheet, Text, View } from 'react-native';

function Avatar({ avatarUrl, username, unreadCount }) {
  const initial = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.avatarWrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>{initial}</Text>
        </View>
      )}
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function ConversationItem({ conversation }) {
  const { other_user, last_message, unread_count } = conversation;

  const formatDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.container, unread_count > 0 && styles.containerUnread]}>
      <Avatar
        avatarUrl={other_user?.avatar_url}
        username={other_user?.username}
        unreadCount={unread_count}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.username} numberOfLines={1}>
            {other_user?.username || 'Utilisateur'}
          </Text>
          <Text style={styles.date}>{formatDate(last_message?.created_at)}</Text>
        </View>
        <Text
          style={[styles.preview, unread_count > 0 && styles.previewUnread]}
          numberOfLines={1}
        >
          {last_message?.content || 'Aucun message'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  containerUnread: {
    backgroundColor: '#fff8f8',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    borderColor: '#e5e7eb',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    width: 36,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarFallbackText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    borderColor: '#ffffff',
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    justifyContent: 'center',
    minWidth: 14,
    paddingHorizontal: 2,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    color: '#111827',
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  date: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '500',
  },
  preview: {
    color: '#6b7280',
    fontSize: 10,
  },
  previewUnread: {
    color: '#111827',
    fontWeight: '600',
  },
});
