import { Image, StyleSheet, Text, View } from 'react-native';

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

export default function FeedCard({ item }) {
  const { activity, author, movie, review } = item;

  return (
    <View style={styles.feedItem}>
      <FeedAvatar
        avatarUrl={author?.avatar_url}
        username={author?.username}
      />

      <View style={styles.feedItemContent}>
        <Text
          style={styles.feedItemHeadline}
          numberOfLines={2}
        >
          {activity?.headline}
        </Text>

        {activity?.body ? (
          <Text
            style={styles.feedItemBody}
            numberOfLines={2}
          >
            {activity.body}
          </Text>
        ) : null}

        <View style={styles.feedItemMeta}>
          {review?.rating ? (
            <View style={styles.feedRatingBadge}>
              <Text style={styles.feedRatingText}>
                ★ {review.rating}
              </Text>
            </View>
          ) : null}

          {movie?.title ? (
            <Text
              style={styles.feedMovieTitle}
              numberOfLines={1}
            >
              {movie.title}
            </Text>
          ) : null}
        </View>
      </View>

      {movie?.poster_url ? (
        <Image
          source={{ uri: movie.poster_url }}
          style={styles.feedPoster}
        />
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

  feedItemBody: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
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

  feedPoster: {
    width: 48,
    height: 68,
    borderRadius: 7,
  },
});
