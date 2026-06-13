import { useRouter } from 'expo-router';
import { Bookmark, Heart, MessageCircle, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import useAuthSession from '../../hooks/useAuthSession';
import {
  createReviewComment,
  getReviewComments,
  toggleReviewLike,
} from '../../services/reviewsApi';

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

function CommentRow({ comment }) {
  const initials = comment.username ? comment.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        {comment.avatar_url ? (
          <Image source={{ uri: comment.avatar_url }} style={styles.commentAvatarImage} />
        ) : (
          <Text style={styles.commentAvatarText}>{initials}</Text>
        )}
      </View>
      <View style={styles.commentBubble}>
        <Text style={styles.commentUsername} numberOfLines={1}>{comment.username || 'User'}</Text>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

export default function FeedCard({ item, currentUserId }) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthSession();
  const { activity, author, movie, review, comment, collection } = item;
  const [liked, setLiked] = useState(Boolean(review?.has_liked));
  const [likesCount, setLikesCount] = useState(Number(review?.likes_count || 0));
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(Number(review?.comments_count || 0));
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
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

  useEffect(() => {
    setLiked(Boolean(review?.has_liked));
    setLikesCount(Number(review?.likes_count || 0));
    setCommentsCount(Number(review?.comments_count || 0));
    setComments([]);
    setCommentsOpen(false);
    setCommentText('');
    setActionError('');
  }, [review?.id, review?.has_liked, review?.likes_count, review?.comments_count]);

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

  const requireAuth = () => {
    router.push('/login');
  };

  const loadComments = async () => {
    if (!review?.id) return;

    setCommentsLoading(true);
    setActionError('');
    try {
      const data = await getReviewComments(review.id);
      const nextComments = Array.isArray(data) ? data : [];
      setComments(nextComments);
      setCommentsCount(nextComments.length);
    } catch (err) {
      setActionError(err.message || 'Unable to load replies.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && comments.length === 0) {
      loadComments();
    }
  };

  const handleLike = async () => {
    if (!review?.id || likeLoading) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    const previousLiked = liked;
    const optimisticLiked = !previousLiked;
    const optimisticDelta = optimisticLiked ? 1 : -1;

    setLikeLoading(true);
    setActionError('');
    setLiked(optimisticLiked);
    setLikesCount((count) => Math.max(0, count + optimisticDelta));

    try {
      const result = await toggleReviewLike({ token, reviewId: review.id });
      const nextLiked = result.status === 'liked';
      setLiked(nextLiked);
      if (Number.isFinite(Number(result.count))) {
        setLikesCount(Number(result.count));
      }
    } catch (err) {
      setLiked(previousLiked);
      setLikesCount((count) => Math.max(0, count - optimisticDelta));
      setActionError(err.message || 'Unable to update this like.');
    } finally {
      setLikeLoading(false);
    }
  };

  const submitComment = async () => {
    const trimmed = commentText.trim();
    if (!review?.id || !trimmed || commentSubmitting) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    setCommentSubmitting(true);
    setActionError('');
    try {
      await createReviewComment({ token, reviewId: review.id, text: trimmed });
      setCommentText('');
      const nextComments = await getReviewComments(review.id);
      const normalized = Array.isArray(nextComments) ? nextComments : [];
      setComments(normalized);
      setCommentsCount(normalized.length);
      setCommentsOpen(true);
    } catch (err) {
      setActionError(err.message || 'Unable to post this reply.');
    } finally {
      setCommentSubmitting(false);
    }
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
        <>
          <View style={styles.feedFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={liked ? "Retirer le j'aime" : "Aimer la critique"}
              disabled={likeLoading}
              onPress={handleLike}
              style={[styles.feedFooterAction, likeLoading && styles.disabledAction]}
            >
              <Heart
                size={12}
                color={liked ? RED : MUTED}
                fill={liked ? RED : 'transparent'}
                strokeWidth={2}
              />
              <Text style={[styles.feedFooterText, liked && styles.feedFooterTextActive]}>
                Like
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Repondre a la critique"
              onPress={toggleComments}
              style={styles.feedFooterAction}
            >
              <MessageCircle size={12} color={commentsOpen ? TEXT : MUTED} strokeWidth={2} />
              <Text style={[styles.feedFooterText, commentsOpen && styles.feedFooterTextOpen]}>
                Reply
              </Text>
            </Pressable>
          </View>

          {(likesCount > 0 || commentsCount > 0) ? (
            <View style={styles.feedCounts}>
              {likesCount > 0 ? (
                <Text style={styles.feedCountText}>
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </Text>
              ) : null}
              {commentsCount > 0 && !commentsOpen ? (
                <Pressable onPress={() => {
                  setCommentsOpen(true);
                  if (comments.length === 0) loadComments();
                }}>
                  <Text style={styles.feedCountLink}>
                    View {commentsCount === 1 ? '1 reply' : `all ${commentsCount} replies`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          {commentsOpen ? (
            <View style={styles.commentsPanel}>
              {commentsLoading ? (
                <ActivityIndicator color={RED} size="small" />
              ) : comments.length > 0 ? (
                <View style={styles.commentsList}>
                  {comments.map((item) => (
                    <CommentRow key={item.id} comment={item} />
                  ))}
                </View>
              ) : (
                <Text style={styles.noCommentsText}>No replies yet.</Text>
              )}

              {isAuthenticated ? (
                <View style={styles.commentComposer}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Write a reply..."
                    placeholderTextColor="#9ca3af"
                    style={styles.commentInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={!commentText.trim() || commentSubmitting}
                    onPress={submitComment}
                    style={[
                      styles.commentPostButton,
                      (!commentText.trim() || commentSubmitting) && styles.disabledAction,
                    ]}
                  >
                    <Text style={styles.commentPostText}>
                      {commentSubmitting ? '...' : 'Post'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={requireAuth} style={styles.signInCommentButton}>
                  <Text style={styles.signInCommentText}>Sign in to reply.</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </>
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

  feedFooterTextActive: {
    color: RED,
    fontWeight: '700',
  },

  feedFooterTextOpen: {
    color: TEXT,
    fontWeight: '700',
  },

  disabledAction: {
    opacity: 0.5,
  },

  feedCounts: {
    gap: 2,
    marginLeft: 40,
    marginTop: 6,
  },

  feedCountText: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '700',
  },

  feedCountLink: {
    color: MUTED,
    fontSize: 11,
  },

  actionError: {
    color: RED,
    fontSize: 10,
    marginLeft: 40,
    marginTop: 6,
  },

  commentsPanel: {
    backgroundColor: '#f9fafb',
    borderColor: BORDER,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginLeft: 40,
    marginTop: 8,
    padding: 10,
  },

  commentsList: {
    gap: 8,
  },

  commentRow: {
    flexDirection: 'row',
    gap: 8,
  },

  commentAvatar: {
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 24,
  },

  commentAvatarImage: {
    height: '100%',
    width: '100%',
  },

  commentAvatarText: {
    color: '#4338ca',
    fontSize: 9,
    fontWeight: '800',
  },

  commentBubble: {
    flex: 1,
  },

  commentUsername: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '800',
  },

  commentText: {
    color: '#4b5563',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },

  noCommentsText: {
    color: MUTED,
    fontSize: 11,
  },

  commentComposer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  commentInput: {
    backgroundColor: '#ffffff',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    color: TEXT,
    flex: 1,
    fontSize: 12,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  commentPostButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 10,
  },

  commentPostText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  signInCommentButton: {
    alignSelf: 'flex-start',
  },

  signInCommentText: {
    color: RED,
    fontSize: 11,
    fontWeight: '700',
  },
});
