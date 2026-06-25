import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  CheckCheck,
  Film,
  Heart,
  MessageCircle,
  Reply,
  ShieldAlert,
  UserPlus,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import RequireAuth from '../src/components/RequireAuth';
import ScreenContainer from '../src/components/ScreenContainer';
import TopNavbar from '../src/components/TopNavbar';
import { useTheme } from '../src/context/ThemeContext';
import { useBottomTabSpacing } from '../src/hooks/useBottomTabSpacing';
import useNotificationBadge from '../src/hooks/useNotificationBadge';
import { useSocket } from '../src/hooks/useSocket';
import {
  followUser,
  getFollowStatus,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../src/services/notificationsApi';

const RED = '#ef0d1a';
const REFRESH_INTERVAL_MS = 5000;

const TYPE_META = {
  FOLLOW: { Icon: UserPlus, color: '#10b981' },
  REVIEW_LIKE: { Icon: Heart, color: RED },
  REVIEW_COMMENT: { Icon: MessageCircle, color: '#3b82f6' },
  COMMENT_REPLY: { Icon: Reply, color: '#3b82f6' },
  MESSAGE: { Icon: MessageCircle, color: '#8b5cf6' },
  MOVIE_RECOMMENDATION: { Icon: Film, color: '#f59e0b' },
  REPORT_CREATED: { Icon: ShieldAlert, color: '#ef4444' },
};

function buildMessage(notification) {
  const actorName = notification.username || 'Quelqu’un';

  if (notification.message && notification.type !== 'MOVIE_RECOMMENDATION') {
    return notification.message;
  }
  if (notification.type === 'FOLLOW' && notification.viewer_follows_actor) {
    return `${actorName} vous suit en retour`;
  }
  if (notification.type === 'FOLLOW') return `${actorName} a commencé à vous suivre`;
  if (notification.type === 'REVIEW_LIKE') return `${actorName} a aimé votre critique`;
  if (notification.type === 'REVIEW_COMMENT') return `${actorName} a commenté votre critique`;
  if (notification.type === 'COMMENT_REPLY') return `${actorName} a répondu à votre commentaire`;
  if (notification.type === 'MESSAGE') return `${actorName} vous a envoyé un message`;
  if (notification.type === 'MOVIE_RECOMMENDATION') {
    if (notification.source_movie_title && notification.movie_title) {
      return `Parce que vous avez ajouté « ${notification.source_movie_title} », vous pourriez aimer « ${notification.movie_title} »`;
    }
    if (notification.movie_title) {
      return `Une nouvelle recommandation est prête : « ${notification.movie_title} »`;
    }
    return 'Une nouvelle recommandation de film est prête pour vous';
  }
  if (notification.type === 'REPORT_CREATED') {
    return 'Un nouveau signalement attend une résolution dans le panneau admin';
  }

  return 'Vous avez une nouvelle notification';
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

function getActorId(notification) {
  return notification.actor_id || notification.actor_user_id;
}

function NotificationAvatar({ notification, onPress }) {
  const { colors } = useTheme();
  const meta = TYPE_META[notification.type] || { Icon: Bell, color: '#6b7280' };
  const initials = notification.username?.slice(0, 2).toUpperCase() || '?';

  return (
    <Pressable
      disabled={!getActorId(notification)}
      onPress={onPress}
      style={styles.avatarWrap}
      hitSlop={6}
    >
      <View style={[styles.avatar, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
        {notification.avatar_url ? (
          <Image source={{ uri: notification.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarInitials, { color: colors.muted }]}>{initials}</Text>
        )}
      </View>
      <View style={[styles.typeIcon, { backgroundColor: colors.card, borderColor: colors.card }]}>
        <meta.Icon color={meta.color} size={14} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

function EmptyState({ unreadOnly }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.cardMuted }]}>
        <Bell color="#9ca3af" size={26} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {unreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.subtle }]}>
        {unreadOnly
          ? 'Vous êtes à jour.'
          : 'Les mentions J’aime, commentaires, abonnements, messages et recommandations apparaîtront ici.'}
      </Text>
    </View>
  );
}

function LoadingState({ bottomOffset = 0 }) {
  return (
    <View style={[styles.loading, { marginBottom: bottomOffset }]}>
      <ActivityIndicator color={RED} size="large" />
    </View>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { scrollPaddingBottom, tabBarHeight } = useBottomTabSpacing();
  const { refreshUnreadCount } = useNotificationBadge();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [followingId, setFollowingId] = useState(null);

  const fetchNotifications = useCallback(async ({ pullToRefresh = false } = {}) => {
    if (pullToRefresh) setRefreshing(true);
    setError('');

    try {
      setNotifications(await getNotifications());
      await refreshUnreadCount();
    } catch (requestError) {
      setError(requestError.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  useEffect(() => {
    const intervalId = setInterval(fetchNotifications, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  useSocket({ onNotificationsChanged: fetchNotifications });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );
  const visibleNotifications = useMemo(
    () => filter === 'unread'
      ? notifications.filter((notification) => !notification.is_read)
      : notifications,
    [filter, notifications]
  );

  const markAsRead = useCallback(async (notification) => {
    if (notification.is_read || markingId) return;
    setMarkingId(notification.id);

    try {
      await markNotificationAsRead(notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )));
      await refreshUnreadCount();
    } catch (requestError) {
      setError(requestError.message || 'Impossible de marquer la notification comme lue.');
    } finally {
      setMarkingId(null);
    }
  }, [markingId, refreshUnreadCount]);

  const openProfile = useCallback((notification) => {
    const actorId = getActorId(notification);
    if (!actorId) return;
    router.push({ pathname: '/publicProfile', params: { id: actorId } });
  }, [router]);

  const openConversation = useCallback(async (notification) => {
    const actorId = getActorId(notification);
    if (!actorId) return;
    await markAsRead(notification);
    router.push({
      pathname: '/conversation/[userId]',
      params: { userId: actorId, username: notification.username || '' },
    });
  }, [markAsRead, router]);

  const openNotification = useCallback(async (notification) => {
    await markAsRead(notification);
    const actorId = getActorId(notification);

    if (notification.type === 'MESSAGE' && actorId) {
      router.push({
        pathname: '/conversation/[userId]',
        params: { userId: actorId, username: notification.username || '' },
      });
      return;
    }

    if (notification.type === 'FOLLOW' && actorId) {
      router.push({ pathname: '/publicProfile', params: { id: actorId } });
      return;
    }

    if (notification.type === 'REPORT_CREATED') {
      router.push({ pathname: '/admin-view', params: { tab: 'reports' } });
      return;
    }

    if (
      ['REVIEW_LIKE', 'REVIEW_COMMENT', 'COMMENT_REPLY'].includes(notification.type)
      && notification.target_movie_tmdb_id
    ) {
      router.push({
        pathname: '/movie/[id]',
        params: {
          id: notification.target_movie_tmdb_id,
          review: notification.target_review_id || '',
          comment: notification.target_comment_id || '',
        },
      });
      return;
    }

    if (notification.movie_tmdb_id) {
      router.push({
        pathname: '/movie/[id]',
        params: { id: notification.movie_tmdb_id },
      });
    }
  }, [markAsRead, router]);

  const handleFollowBack = useCallback(async (notification) => {
    const actorId = getActorId(notification);
    if (!actorId || followingId) return;
    setFollowingId(notification.id);

    try {
      await markAsRead(notification);
      const alreadyFollowing = await getFollowStatus(actorId);
      const result = alreadyFollowing ? null : await followUser(actorId);

      if (alreadyFollowing || result?.status === 'followed') {
        setNotifications((current) => current.map((item) => (
          item.id === notification.id
            ? { ...item, is_read: true, viewer_follows_actor: true }
            : item
        )));
      }
    } catch (requestError) {
      setError(requestError.message || 'Impossible de suivre cet utilisateur.');
    } finally {
      setFollowingId(null);
    }
  }, [followingId, markAsRead]);

  const handleMarkAll = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setError('');

    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      await refreshUnreadCount();
    } catch (requestError) {
      setError(requestError.message || 'Impossible de tout marquer comme lu.');
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, refreshUnreadCount, unreadCount]);

  const renderNotification = useCallback(({ item }) => {
    const isFollowing = item.viewer_follows_actor;
    const isBusy = markingId === item.id || followingId === item.id;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: isBusy }}
        onPress={() => openNotification(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: item.is_read ? colors.card : colors.activeSoft,
            borderColor: item.is_read ? colors.border : RED,
          },
          pressed && styles.cardPressed,
        ]}
      >
        <NotificationAvatar
          notification={item}
          onPress={() => openProfile(item)}
        />

        <View style={styles.cardContent}>
          <Text style={[styles.message, { color: colors.text }]}>{buildMessage(item)}</Text>
          <Text style={[styles.date, { color: colors.subtle }]}>{formatDate(item.created_at)}</Text>

          {item.type === 'FOLLOW' && getActorId(item) ? (
            <Pressable
              disabled={isBusy}
              onPress={(event) => {
                event.stopPropagation();
                if (isFollowing) openConversation(item);
                else handleFollowBack(item);
              }}
              style={[styles.actionButton, isBusy && styles.actionButtonDisabled]}
            >
              {isBusy ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {isFollowing ? 'Message' : 'Suivre en retour'}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>

        {!item.is_read ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    );
  }, [
    followingId,
    handleFollowBack,
    markingId,
    openConversation,
    openNotification,
    openProfile,
  ]);

  return (
    <ScreenContainer backgroundColor={colors.bg}>
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopNavbar />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Restez informé de votre communauté cinéma</Text>
          </View>
          <Pressable
            disabled={markingAll || unreadCount === 0}
            onPress={handleMarkAll}
            style={[
              styles.markAllButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              unreadCount === 0 && styles.markAllButtonDisabled,
            ]}
          >
            {markingAll ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <CheckCheck color={colors.text} size={18} />
            )}
          </Pressable>
        </View>

        <View style={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { key: 'all', label: 'Toutes', count: notifications.length },
            { key: 'unread', label: 'Non lues', count: unreadCount },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterButton, active && { backgroundColor: colors.cardMuted }]}
              >
                <Text style={[styles.filterText, { color: colors.muted }, active && { color: colors.text }]}>
                  {item.label} ({item.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            <Pressable onPress={() => fetchNotifications()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <LoadingState bottomOffset={tabBarHeight} />
        ) : (
          <FlatList
            data={visibleNotifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderNotification}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: scrollPaddingBottom },
              visibleNotifications.length === 0 && styles.emptyList,
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<EmptyState unreadOnly={filter === 'unread'} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNotifications({ pullToRefresh: true })}
                colors={[RED]}
                tintColor={RED}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <BottomTabBar />
      </View>
    </ScreenContainer>
  );
}

export default function Notifications() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 5,
  },
  markAllButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  markAllButtonDisabled: {
    opacity: 0.45,
  },
  filters: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 18,
    padding: 3,
  },
  filterButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  filterText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#111827',
  },
  error: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#be123c',
    flex: 1,
    fontSize: 11,
    marginRight: 10,
  },
  retryText: {
    color: '#be123c',
    fontSize: 11,
    fontWeight: '800',
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 14,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 9,
  },
  card: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  cardPressed: {
    opacity: 0.78,
  },
  avatarWrap: {
    height: 50,
    marginRight: 12,
    position: 'relative',
    width: 50,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitials: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
  },
  typeIcon: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    bottom: 0,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 24,
  },
  cardContent: {
    flex: 1,
    paddingRight: 14,
  },
  message: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  date: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 5,
  },
  actionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: RED,
    borderRadius: 9,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  unreadDot: {
    backgroundColor: RED,
    borderRadius: 5,
    height: 9,
    position: 'absolute',
    right: 14,
    top: '50%',
    width: 9,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    textAlign: 'center',
  },
});
