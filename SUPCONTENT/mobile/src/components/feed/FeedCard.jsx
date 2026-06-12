import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.feedItem}>
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

      <View style={styles.feedItemContent}>
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
              numberOfLines={2}
            >
              {activity.body}
            </Text>
          </Pressable>
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
              <Text style={styles.feedRatingText}>
                ★ {review.rating}
              </Text>
            </Pressable>
          ) : null}

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
        </View>

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

      {movie?.poster_url ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            canOpenCollection
              ? `Ouvrir la liste ${collection?.name || ''}`.trim()
              : `Ouvrir ${movie.title || 'le film'}`
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
    </View>
  );
}

const styles = StyleSheet.create({
  feedItem: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#eef0f3',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },

  feedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  feedAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },

  feedAvatarFallbackText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },

  feedItemContent: {
    flex: 1,
    gap: 2,
  },

  feedItemHeadline: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  feedAuthorName: {
    color: '#111827',
    fontWeight: '800',
  },

  feedItemBody: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },

  feedItemBodyLink: {
    color: '#374151',
  },

  feedItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },

  feedRatingBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  feedRatingText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
  },

  feedMovieTitle: {
    color: '#9ca3af',
    fontSize: 10,
    flex: 1,
  },

  feedCollection: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  feedCollectionLabel: {
    color: '#6d28d9',
    fontSize: 10,
    fontWeight: '800',
  },

  feedPoster: {
    width: 48,
    height: 68,
    borderRadius: 7,
  },
});
