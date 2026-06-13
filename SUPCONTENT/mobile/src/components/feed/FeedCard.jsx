import { useRouter } from 'expo-router';
import { Bookmark, Heart, MessageCircle, Star } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const RED = '#ef0d1a';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const PANEL = '#fafafa';
const YELLOW = '#f59e0b';
const GREEN = '#22c55e';
const BLUE = '#2563eb';

function formatTimeAgo(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return 'now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

function getYear(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear());

  const match = String(dateStr).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function getActionStyle(type) {
  if (type === 'COLLECTION_MOVIE_ADDED') {
    return { color: RED, icon: Bookmark };
  }

  if (type === 'REVIEW_COMMENTED') {
    return { color: BLUE, icon: MessageCircle };
  }

  if (type === 'RATING_GIVEN') {
    return { color: YELLOW, icon: Star };
  }

  return { color: GREEN, icon: MessageCircle };
}

function FeedAvatar({ avatarUrl, username }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.feedAvatar}
      />
    );
  }

  const initial = username
    ? username.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.feedAvatarFallback}>
      <Text style={styles.feedAvatarFallbackText}>
        {initial}
      </Text>
    </View>
  );
}

export default function FeedCard({ item, currentUserId }) {
  const router = useRouter();
  const { activity, author, movie, review, comment, collection } = item;
  const username = author?.username || '';
  const headline = activity?.headline || '';
  const headlineWithoutUsername = username && headline.startsWith(username)
    ? headline.slice(username.length).trimStart()
    : headline;
  const canOpenReviewTarget = Boolean(movie?.external_id && review?.id);
  const canOpenCollection = Boolean(collection?.id);
  const activityDate = formatTimeAgo(activity?.created_at);
  const movieYear = getYear(movie?.release_date);
  const actionStyle = getActionStyle(item?.type || activity?.type);
  const ActionIcon = actionStyle.icon;
  const hasMoviePanel = Boolean(movie?.title || movie?.poster_url || review?.rating);

  const openAuthorProfile = () => {
    if (!author?.id) return;

    if (String(author.id) === String(currentUserId)) {
      router.push('/profile');
      return;
    }

    router.push({
      pathname: '/publicProfile',
      params: { id: String(author.id) },
    });
  };

  const openReviewTarget = () => {
    if (!canOpenReviewTarget) return;

    router.push({
      pathname: '/movie/[id]',
      params: {
        id: String(movie.external_id),
        review: String(review.id),
        ...(comment?.id ? { comment: String(comment.id) } : {}),
      },
    });
  };

  const openCollection = () => {
    if (!collection?.id) return;

    router.push({
      pathname: '/list/[id]',
      params: { id: String(collection.id) },
    });
  };

  const openMovie = () => {
    if (canOpenCollection) {
      openCollection();
      return;
    }

    if (!movie?.external_id) return;

    if (canOpenReviewTarget) {
      openReviewTarget();
      return;
    }

    router.push(`/movie/${movie.external_id}`);
  };

  const openPrimaryTarget = () => {
    if (canOpenCollection) {
      openCollection();
      return;
    }

    if (canOpenReviewTarget) {
      openReviewTarget();
      return;
    }

    openMovie();
  };

  return (
    <View style={styles.feedItem}>
      <View style={styles.feedHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${username}`}
          disabled={!author?.id}
          hitSlop={8}
          onPress={openAuthorProfile}
        >
          <FeedAvatar
            avatarUrl={author?.avatar_url}
            username={username}
          />
        </Pressable>

        <View style={styles.feedHeaderContent}>
          <Text
            style={styles.feedItemHeadline}
            numberOfLines={2}
          >
            {username ? (
              <Text
                accessibilityRole="link"
                onPress={openAuthorProfile}
                style={styles.feedAuthorName}
              >
                {username}
              </Text>
            ) : null}
            {headlineWithoutUsername ? `${username ? ' ' : ''}${headlineWithoutUsername}` : null}
          </Text>

          {activityDate ? (
            <Text style={styles.feedDate}>
              {activityDate}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole={canOpenReviewTarget || canOpenCollection || movie?.external_id ? 'button' : undefined}
          accessibilityLabel="Ouvrir l'activite"
          disabled={!canOpenReviewTarget && !canOpenCollection && !movie?.external_id}
          hitSlop={8}
          onPress={openPrimaryTarget}
          style={styles.feedAction}
        >
          <ActionIcon
            size={16}
            color={actionStyle.color}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {hasMoviePanel ? (
        <View style={styles.moviePanel}>
          {movie?.poster_url ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                canOpenCollection
                  ? `Ouvrir la liste ${collection?.name || ''}`.trim()
                  : `Ouvrir ${movie?.title || 'le film'}`
              }
              disabled={!canOpenCollection && !movie?.external_id}
              onPress={openMovie}
            >
              <Image
                source={{ uri: movie.poster_url }}
                style={styles.feedPoster}
              />
            </Pressable>
          ) : null}

          <View style={styles.moviePanelContent}>
            {movie?.title ? (
              <Text
                accessibilityRole="button"
                onPress={openMovie}
                style={styles.feedMovieTitle}
                numberOfLines={1}
              >
                {movie.title}
              </Text>
            ) : null}

            {movieYear ? (
              <Text style={styles.movieYear}>
                {movieYear}
              </Text>
            ) : null}

            <View style={styles.feedItemMeta}>
              {review?.rating ? (
                <Pressable
                  accessibilityRole={canOpenReviewTarget ? 'button' : undefined}
                  accessibilityLabel={canOpenReviewTarget ? 'Ouvrir la critique' : undefined}
                  disabled={!canOpenReviewTarget}
                  onPress={openReviewTarget}
                  style={styles.feedRatingBadge}
                >
                  <Star
                    size={11}
                    color={YELLOW}
                    fill={YELLOW}
                    strokeWidth={2}
                  />
                  <Text style={styles.feedRatingText}>
                    {review.rating}
                  </Text>
                </Pressable>
              ) : null}

              {collection?.name ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir la liste ${collection.name}`}
                  disabled={!canOpenCollection}
                  onPress={openCollection}
                  style={styles.feedCollection}
                >
                  <Text style={styles.feedCollectionLabel} numberOfLines={1}>
                    {collection.name}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {activity?.body ? (
        <Pressable
          accessibilityRole={canOpenReviewTarget || canOpenCollection ? 'button' : undefined}
          accessibilityLabel={
            canOpenCollection
              ? 'Ouvrir la liste'
              : canOpenReviewTarget
                ? 'Ouvrir la critique'
                : undefined
          }
          disabled={!canOpenReviewTarget && !canOpenCollection}
          onPress={canOpenCollection ? openCollection : openReviewTarget}
        >
          <Text
            style={[
              styles.feedItemBody,
              (canOpenReviewTarget || canOpenCollection) && styles.feedItemBodyLink,
            ]}
            numberOfLines={3}
          >
            "{activity.body}"
          </Text>
        </Pressable>
      ) : null}

      {canOpenReviewTarget ? (
        <View style={styles.feedFooter}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les mentions j'aime"
            onPress={openReviewTarget}
            style={styles.feedFooterAction}
          >
            <Heart size={12} color={MUTED} strokeWidth={2} />
            <Text style={styles.feedFooterText}>
              Like
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les reponses"
            onPress={openReviewTarget}
            style={styles.feedFooterAction}
          >
            <MessageCircle size={12} color={MUTED} strokeWidth={2} />
            <Text style={styles.feedFooterText}>
              Reply
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feedItem: {
    backgroundColor: '#ffffff',
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  feedHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },

  feedHeaderContent: {
    flex: 1,
    paddingTop: 1,
  },

  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  feedAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },

  feedAvatarFallbackText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },

  feedItemHeadline: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },

  feedAuthorName: {
    color: TEXT,
    fontWeight: '800',
  },

  feedDate: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },

  feedAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },

  moviePanel: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: PANEL,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    minHeight: 76,
    padding: 8,
    width: '82%',
  },

  moviePanelContent: {
    flex: 1,
  },

  feedItemBody: {
    color: '#4b5563',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    marginLeft: 40,
    marginTop: 8,
  },

  feedItemBodyLink: {
    color: '#374151',
  },

  feedItemMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },

  feedRatingBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },

  feedRatingText: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '700',
  },

  feedMovieTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
  },

  movieYear: {
    color: MUTED,
    fontSize: 10,
    marginTop: 1,
  },

  feedCollection: {
    flex: 1,
  },

  feedCollectionLabel: {
    color: RED,
    fontSize: 10,
    fontWeight: '700',
  },

  feedPoster: {
    width: 44,
    height: 62,
    borderRadius: 4,
  },

  feedFooter: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 40,
    marginTop: 8,
    minHeight: 16,
  },

  feedFooterAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },

  feedFooterText: {
    color: MUTED,
    fontSize: 10,
  },
});
