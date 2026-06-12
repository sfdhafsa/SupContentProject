import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getMovieById } from '../../src/services/moviesApi';
import {
  createReview,
  createReviewComment,
  deleteReview,
  getMovieReviews,
  getReviewComments,
  toggleReviewLike,
  updateReview,
} from '../../src/services/reviewsApi';
import useAuthSession from '../../src/hooks/useAuthSession';

const { width: SW, height: SH } = Dimensions.get('window');
const BACKDROP_H = Math.round(SH * 0.32);
const POSTER_W   = Math.round(SW * 0.30);
const POSTER_H   = Math.round(POSTER_W * 1.5);

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray200:'#e5e7eb',
  gray400:'#9ca3af',
  gray500:'#6b7280',
  gray800:'#1f2937',
  yellow: '#f59e0b',
  bg:     '#030712',
  green:  '#10b981',
};

function Stars({ rating, size = 14 }) {
  const filled = Math.round((rating / 10) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < filled ? C.yellow : 'rgba(255,255,255,0.22)' }}>★</Text>
      ))}
    </View>
  );
}

function RatingPicker({ value, onChange }) {
  return (
    <View style={s.ratingPicker}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={8}
          style={s.ratingStarButton}
        >
          <Text style={[s.ratingStar, star <= value && s.ratingStarActive]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReviewForm({ initialReview, submitting, error, onCancel, onSubmit }) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [text, setText] = useState(initialReview?.text || '');
  const [containsSpoiler, setContainsSpoiler] = useState(!!initialReview?.contains_spoiler);

  useEffect(() => {
    setRating(initialReview?.rating || 0);
    setText(initialReview?.text || '');
    setContainsSpoiler(!!initialReview?.contains_spoiler);
  }, [initialReview]);

  const trimmedText = text.trim();
  const canSubmit = rating > 0 && !submitting;

  return (
    <View style={s.reviewFormCard}>
      <View style={s.reviewFormHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewFormTitle}>{initialReview ? 'Edit your review' : 'Write a review'}</Text>
          <Text style={s.reviewFormHint}>Share a rating, with or without written thoughts.</Text>
        </View>
        <RatingPicker value={rating} onChange={setRating} />
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1200}
        placeholder="What did you think of this movie? Optional."
        placeholderTextColor="rgba(148,163,184,0.72)"
        style={s.reviewInput}
        textAlignVertical="top"
      />

      {error ? <Text style={s.reviewError}>{error}</Text> : null}

      <View style={s.reviewFormFooter}>
        <Pressable
          onPress={() => setContainsSpoiler((value) => !value)}
          disabled={!trimmedText}
          style={[s.spoilerToggle, !trimmedText && s.disabledControl]}
        >
          <View style={[s.checkbox, containsSpoiler && s.checkboxActive]}>
            {containsSpoiler ? <Text style={s.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={s.spoilerText}>Contains spoilers</Text>
        </Pressable>

        <View style={s.reviewActions}>
          {onCancel ? (
            <Pressable onPress={onCancel} style={s.secondaryButton}>
              <Text style={s.secondaryButtonText}>Cancel</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              if (!canSubmit) return;
              onSubmit({
                rating,
                text: trimmedText || null,
                containsSpoiler: trimmedText ? containsSpoiler : false,
              });
            }}
            disabled={!canSubmit}
            style={[s.postButton, !canSubmit && s.disabledButton]}
          >
            <Text style={s.postButtonText}>
              {submitting ? 'Saving...' : initialReview ? 'Save changes' : trimmedText ? 'Post review' : 'Post rating'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CommentRow({ comment, targetCommentId }) {
  const initials = comment.username ? comment.username.slice(0, 2).toUpperCase() : 'U';
  const isTarget = String(comment.id) === String(targetCommentId);

  return (
    <View style={s.commentRow}>
      <View style={s.commentAvatar}>
        {comment.avatar_url ? (
          <Image source={{ uri: comment.avatar_url }} style={s.commentAvatarImage} />
        ) : (
          <Text style={s.commentAvatarText}>{initials}</Text>
        )}
      </View>
      <View style={[s.commentBubble, isTarget && s.focusedCommentBubble]}>
        <Text style={s.commentUsername} numberOfLines={1}>{comment.username || 'User'}</Text>
        <Text style={s.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

function ReviewCard({
  review,
  currentUserId,
  token,
  isAuthenticated,
  onEdit,
  onDelete,
  onLiked,
  onCommentCountChange,
  onRequireAuth,
  shouldFocus,
  targetCommentId,
  onFocusedLayout,
}) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [liked, setLiked] = useState(Boolean(review.has_liked));
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeError, setLikeError] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const isMine = String(review.user_id) === String(currentUserId);
  const initials = review.username ? review.username.slice(0, 2).toUpperCase() : 'U';
  const hasText = typeof review.text === 'string' && review.text.trim().length > 0;
  const commentsCount = Number(review.comments_count || comments.length || 0);

  const isJsonParseError = (err) =>
    err instanceof SyntaxError ||
    String(err?.message || '').toLowerCase().includes('not valid json') ||
    String(err?.message || '').toLowerCase().includes('unexpected token');

  useEffect(() => {
    setLiked(Boolean(review.has_liked));
  }, [review.has_liked]);

  useEffect(() => {
    if (!shouldFocus) return;

    if (targetCommentId) {
      setCommentsOpen(true);
    }
    if (targetCommentId && comments.length === 0) {
      loadComments();
    }
  }, [shouldFocus, targetCommentId, review.id]);

  async function loadComments() {
    setCommentsLoading(true);
    setCommentError('');
    try {
      const data = await getReviewComments(review.id);
      const nextComments = Array.isArray(data) ? data : [];
      setComments(nextComments);
      onCommentCountChange(review.id, nextComments.length);
    } catch (err) {
      setCommentError(err.message || 'Unable to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }

  const toggleComments = () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && comments.length === 0) {
      loadComments();
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (likeLoading) return;

    const previousLiked = liked;
    const optimisticLiked = !previousLiked;
    const optimisticDelta = optimisticLiked ? 1 : -1;

    setLikeLoading(true);
    setLikeError('');
    setLiked(optimisticLiked);
    onLiked(review.id, {
      count: null,
      delta: optimisticDelta,
      liked: optimisticLiked,
    });

    try {
      const result = await toggleReviewLike({ token, reviewId: review.id });
      if (!['liked', 'unliked'].includes(result.status)) {
        return;
      }

      const nextLiked = result.status === 'liked';
      setLiked(nextLiked);
      onLiked(review.id, {
        count: Number.isFinite(Number(result.count)) ? Number(result.count) : null,
        delta: 0,
        liked: nextLiked,
      });
    } catch (err) {
      if (isJsonParseError(err)) {
        return;
      }

      setLiked(previousLiked);
      onLiked(review.id, {
        count: null,
        delta: -optimisticDelta,
        liked: previousLiked,
      });
      setLikeError(err.message || 'Unable to update this like.');
    } finally {
      setLikeLoading(false);
    }
  };

  const submitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !isAuthenticated || commentSubmitting) return;

    setCommentSubmitting(true);
    setCommentError('');
    try {
      await createReviewComment({ token, reviewId: review.id, text: trimmed });
      setCommentText('');
      const nextComments = await getReviewComments(review.id);
      const normalized = Array.isArray(nextComments) ? nextComments : [];
      setComments(normalized);
      onCommentCountChange(review.id, normalized.length);
    } catch (err) {
      setCommentError(err.message || 'Unable to post this comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <View
      onLayout={(event) => {
        if (shouldFocus) {
          onFocusedLayout?.(event.nativeEvent.layout.y);
        }
      }}
      style={[
        s.reviewCard,
        review.is_featured && s.featuredReviewCard,
        shouldFocus && s.focusedReviewCard,
      ]}
    >
      <View style={s.reviewCardHeader}>
        <View style={s.reviewAvatar}>
          {review.avatar_url ? (
            <Image source={{ uri: review.avatar_url }} style={s.reviewAvatarImage} />
          ) : (
            <Text style={s.reviewAvatarText}>{initials}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.reviewNameRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.reviewUsername} numberOfLines={1}>{review.username || 'User'}</Text>
              <Stars rating={(Number(review.rating || 0) / 5) * 10} size={13} />
            </View>
            {isMine ? (
              <View style={s.ownerActions}>
                <Pressable onPress={() => onEdit(review)} hitSlop={8} style={s.iconButton}>
                  <Text style={s.iconButtonText}>✎</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(review.id)} hitSlop={8} style={s.iconButton}>
                  <Text style={s.iconButtonText}>⌫</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {review.is_featured ? (
            <View style={s.featuredBadge}>
              <Text style={s.featuredBadgeText}>Featured review</Text>
            </View>
          ) : null}

          <View style={s.reviewBody}>
            {hasText && review.contains_spoiler && !showSpoiler ? (
              <Pressable onPress={() => setShowSpoiler(true)} style={s.spoilerCard}>
                <Text style={s.spoilerCardText}>This review contains spoilers. Tap to reveal.</Text>
              </Pressable>
            ) : hasText ? (
              <Text style={s.reviewText}>{review.text}</Text>
            ) : (
              <Text style={s.reviewMutedText}>Rated this movie.</Text>
            )}
          </View>

          <View style={s.reviewMetaBar}>
            <Pressable
              onPress={handleLike}
              disabled={likeLoading}
              hitSlop={8}
              style={[s.reviewMetaButton, liked && s.reviewMetaButtonActive, likeLoading && s.disabledControl]}
            >
              <Text style={[s.reviewMetaIcon, liked && s.reviewMetaIconActive]}>{liked ? '♥' : '♡'}</Text>
            </Pressable>
            <Pressable onPress={toggleComments} hitSlop={8} style={s.reviewMetaButton}>
              <Text style={[s.reviewMetaIcon, commentsOpen && s.reviewMetaIconActive]}>▢</Text>
            </Pressable>
          </View>
          {(review.likes_count || 0) > 0 || commentsCount > 0 ? (
            <View style={s.reviewCountRow}>
            <Text style={s.likesText}>
              {review.likes_count || 0} {(review.likes_count || 0) === 1 ? 'like' : 'likes'}
            </Text>
              <Text style={s.likesText}>
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </Text>
            </View>
          ) : null}
          {likeError ? <Text style={s.commentError}>{likeError}</Text> : null}

          {commentsOpen ? (
            <View style={s.commentsPanel}>
              {commentsLoading ? (
                <ActivityIndicator color={C.red} size="small" />
              ) : comments.length === 0 ? (
                <Text style={s.noCommentsText}>No comments yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {comments.map((comment) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      targetCommentId={targetCommentId}
                    />
                  ))}
                </View>
              )}

              {commentError ? <Text style={s.commentError}>{commentError}</Text> : null}

              {isAuthenticated ? (
                <View style={s.commentComposer}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add a comment..."
                    placeholderTextColor="rgba(148,163,184,0.72)"
                    style={s.commentInput}
                  />
                  <Pressable
                    onPress={submitComment}
                    disabled={!commentText.trim() || commentSubmitting}
                    style={[s.commentPostButton, (!commentText.trim() || commentSubmitting) && s.disabledButton]}
                  >
                    <Text style={s.commentPostText}>{commentSubmitting ? '...' : 'Post'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={onRequireAuth} style={s.commentSignInHint}>
                  <Text style={s.commentSignInHintText}>Sign in to comment.</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ReviewsSection({
  tmdbId,
  router,
  targetReviewId,
  targetCommentId,
  onFocusedReviewLayout,
}) {
  const { token, user, loading: authLoading, isAuthenticated } = useAuthSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [notice, setNotice] = useState('');
  const reviewsListYRef = useRef(0);

  const myReview = reviews.find((review) => String(review.user_id) === String(user?.id));

  const loadReviews = () => {
    setLoading(true);
    getMovieReviews(tmdbId, token)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [tmdbId, token]);

  const submitReview = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    setNotice('');

    try {
      if (editingReview) {
        await updateReview({ token, reviewId: editingReview.id, ...payload });
        setEditingReview(null);
      } else {
        await createReview({ token, tmdbId, ...payload });
      }
      const nextReviews = await getMovieReviews(tmdbId, token);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
    } catch (err) {
      setFormError(err.message || 'Unable to save this review.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async (reviewId) => {
    if (!token) return;
    try {
      await deleteReview({ token, reviewId });
      setReviews((items) => items.filter((item) => item.id !== reviewId));
      if (editingReview?.id === reviewId) setEditingReview(null);
    } catch (err) {
      setNotice(err.message || 'Unable to delete this review.');
    }
  };

  const updateLikes = (reviewId, { count, delta, liked }) => {
    setReviews((items) =>
      items.map((item) =>
        item.id === reviewId
          ? {
              ...item,
              has_liked: liked ?? delta > 0,
              likes_count: count ?? Math.max(0, (item.likes_count || 0) + delta),
            }
          : item
      )
    );
  };

  const updateCommentCount = (reviewId, count) => {
    setReviews((items) =>
      items.map((item) =>
        item.id === reviewId ? { ...item, comments_count: count } : item
      )
    );
  };

  return (
    <View style={s.reviewsSection}>
      <View style={s.reviewsHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewsTitle}>Reviews</Text>
          <Text style={s.reviewsCount}>
            {reviews.length} community {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        {!authLoading && !isAuthenticated ? (
          <Pressable onPress={() => router.push('/login')} style={s.signInReviewButton}>
            <Text style={s.signInReviewText}>Sign in to review</Text>
          </Pressable>
        ) : null}
      </View>

      {isAuthenticated && (!myReview || editingReview) ? (
        <ReviewForm
          initialReview={editingReview}
          submitting={submitting}
          error={formError}
          onCancel={editingReview ? () => {
            setEditingReview(null);
            setFormError(null);
          } : null}
          onSubmit={submitReview}
        />
      ) : null}

      {isAuthenticated && myReview && !editingReview ? (
        <View style={s.reviewNotice}>
          <Text style={s.reviewNoticeText}>
            You already reviewed this movie. Use the edit button on your review to update it.
          </Text>
        </View>
      ) : null}

      {notice ? (
        <View style={s.reviewNotice}>
          <Text style={s.reviewNoticeText}>{notice}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={s.emptyReviewsCard}>
          <ActivityIndicator color={C.red} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.emptyReviewsCard}>
          <Text style={s.emptyReviewsTitle}>No reviews yet</Text>
          <Text style={s.emptyReviewsText}>Be the first to share your thoughts about this movie.</Text>
        </View>
      ) : (
        <View
          onLayout={(event) => {
            reviewsListYRef.current = event.nativeEvent.layout.y;
          }}
          style={{ gap: 12 }}
        >
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              token={token}
              isAuthenticated={isAuthenticated}
              onEdit={(item) => {
                setFormError(null);
                setEditingReview(item);
              }}
              onDelete={removeReview}
              onLiked={updateLikes}
              onCommentCountChange={updateCommentCount}
              onRequireAuth={() => router.push('/login')}
              shouldFocus={String(review.id) === String(targetReviewId)}
              targetCommentId={String(review.id) === String(targetReviewId) ? targetCommentId : null}
              onFocusedLayout={(reviewY) => {
                onFocusedReviewLayout?.(reviewsListYRef.current + reviewY);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CrewCard({ name, role }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={s.crewCard}>
      <View style={s.crewAvatar}>
        <Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.white, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{name}</Text>
        {role && <Text style={{ color: C.gray400, fontSize: 11, marginTop: 1 }} numberOfLines={1}>{role}</Text>}
      </View>
    </View>
  );
}

function formatMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MovieDetail() {
  const { id, review: targetReviewId, comment: targetCommentId } = useLocalSearchParams();
  const router    = useRouter();
  const scrollRef = useRef(null);
  const reviewsSectionYRef = useRef(0);
  const [movie, setMovie]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMovieById(id)
      .then(setMovie)
      .catch(() => setError('Film introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: C.white, fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 24 }}>
          {error || 'Film introuvable'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ backgroundColor: C.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>← Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const year    = movie.release_date?.slice(0, 4);
  const rating  = movie.vote_average ? parseFloat(movie.vote_average) : null;
  const budget  = formatMoney(movie.budget);
  const revenue = formatMoney(movie.revenue);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        bounces
      >
        {/* ── BACKDROP ── */}
        <View style={{ width: SW, height: BACKDROP_H }}>
          {(movie.backdrop_url || movie.poster_url)
            ? <Image
                source={{ uri: movie.backdrop_url || movie.poster_url }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.gray800 }]} />
          }
          {/* Overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,7,18,0.58)' }]} />

          {/* Bouton retour en SafeAreaView */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={{
                margin: 14,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: C.white, fontSize: 20, lineHeight: 24 }}>←</Text>
            </Pressable>
          </SafeAreaView>

          {/* Poster avec glow */}
          <View style={{
            position: 'absolute',
            bottom: -(POSTER_H * 0.42),
            left: 16,
          }}>
            {/* Glow */}
            <View style={{
              position: 'absolute',
              width: POSTER_W + 18,
              height: POSTER_H + 18,
              top: -9,
              left: -9,
              borderRadius: 14,
              backgroundColor: C.red,
              opacity: 0.18,
            }} />
            <View style={{
              width: POSTER_W,
              height: POSTER_H,
              borderRadius: 12,
              overflow: 'hidden',
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}>
              {movie.poster_url
                ? <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <View style={{ flex: 1, backgroundColor: C.gray800, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 36 }}>🎬</Text>
                  </View>
              }
            </View>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={{ paddingTop: POSTER_H * 0.48, paddingHorizontal: 16 }}>

          {/* Genres */}
          {movie.genres?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 14 }}
            >
              {movie.genres.map((g) => (
                <View key={g.id} style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>{g.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Titre */}
          <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 4 }}>
            {movie.title}
          </Text>
          {movie.tagline && (
            <Text style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>
              "{movie.tagline}"
            </Text>
          )}

          {/* Meta */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            {year && <Text style={{ color: C.gray400, fontSize: 13 }}>{year}</Text>}
            {year && movie.runtime_minutes && <Text style={{ color: C.gray500 }}>•</Text>}
            {movie.runtime_minutes && (
              <Text style={{ color: C.gray400, fontSize: 13 }}>
                {Math.floor(movie.runtime_minutes / 60)}h{movie.runtime_minutes % 60}min
              </Text>
            )}
            {movie.original_language && (
              <>
                <Text style={{ color: C.gray500 }}>•</Text>
                <Text style={{ color: C.gray400, fontSize: 13, textTransform: 'uppercase' }}>
                  {movie.original_language}
                </Text>
              </>
            )}
            {movie.status && (
              <>
                <Text style={{ color: C.gray500 }}>•</Text>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16,185,129,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.3)',
                }}>
                  <Text style={{ color: C.green, fontSize: 11, fontWeight: '700' }}>{movie.status}</Text>
                </View>
              </>
            )}
          </View>

          {/* Rating */}
          {rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              backgroundColor: 'rgba(255,255,255,0.05)',
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              flexWrap: 'wrap',
            }}>
              <Stars rating={rating} size={16} />
              <Text style={{ color: C.white, fontSize: 20, fontWeight: '800' }}>{rating.toFixed(1)}</Text>
              <Text style={{ color: C.gray400, fontSize: 13 }}>/ 10</Text>
              {movie.vote_count && (
                <Text style={{ color: C.gray500, fontSize: 12 }}>
                  ({movie.vote_count.toLocaleString()} votes)
                </Text>
              )}
            </View>
          )}

          {/* Synopsis */}
          {movie.overview && (
            <View style={{ marginBottom: 16 }}>
              <Text style={s.sectionLbl}>SYNOPSIS</Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 22 }}>
                {movie.overview}
              </Text>
            </View>
          )}

          {/* Budget / Revenue */}
          {(budget || revenue) && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {budget && (
                <View style={s.statCard}>
                  <Text style={s.statLbl}>Budget</Text>
                  <Text style={s.statVal}>{budget}</Text>
                </View>
              )}
              {revenue && (
                <View style={[s.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={s.statLbl}>Revenus</Text>
                  <Text style={[s.statVal, { color: C.green }]}>{revenue}</Text>
                </View>
              )}
            </View>
          )}

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <Pressable
              style={{ flex: 1, backgroundColor: C.red, paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
              onPress={() => {/* personne 3 */}}
            >
              <Text style={{ color: C.white, fontSize: 15, fontWeight: '800' }}>+ Ma bibliothèque</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              hitSlop={6}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' }}>← Retour</Text>
            </Pressable>
          </View>

          {/* Réalisateur */}
          {movie.directors?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>
                {movie.directors.length > 1 ? 'RÉALISATEURS' : 'RÉALISATEUR'}
              </Text>
              {movie.directors.map((d) => <CrewCard key={d.id} name={d.name} />)}
            </View>
          )}

          {/* Casting */}
          {movie.cast?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>CASTING</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14 }}
              >
                {movie.cast.map((person) => (
                  <View key={person.id} style={{ width: 70, alignItems: 'center' }}>
                    <View style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      overflow: 'hidden',
                      backgroundColor: C.gray800,
                      marginBottom: 6,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}>
                      {person.photo_url
                        ? <Image source={{ uri: person.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>👤</Text>
                          </View>
                      }
                    </View>
                    <Text style={{ color: C.white, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>
                      {person.name}
                    </Text>
                    <Text style={{ color: C.gray400, fontSize: 9, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                      {person.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Scénaristes + Producteurs */}
          {(movie.writers?.length > 0 || movie.producers?.length > 0) && (
            <View style={{ marginBottom: 20 }}>
              {movie.writers?.length > 0 && (
                <>
                  <Text style={s.sectionLbl}>SCÉNARISTE(S)</Text>
                  {movie.writers.map((w) => <CrewCard key={w.id} name={w.name} role={w.job} />)}
                </>
              )}
              {movie.producers?.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop: 14 }]}>PRODUCTEUR(S)</Text>
                  {movie.producers.map((p) => <CrewCard key={p.id} name={p.name} role="Producteur" />)}
                </>
              )}
            </View>
          )}

          {/* Films similaires */}
          {movie.similar?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>FILMS SIMILAIRES</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {movie.similar.map((m) => (
                  <Pressable
                    key={m.tmdb_id}
                    onPress={() => router.push(`/movie/${m.tmdb_id}`)}
                    style={{ width: Math.round(SW * 0.24) }}
                  >
                    <View style={{
                      width: Math.round(SW * 0.24),
                      height: Math.round(SW * 0.24 * 1.5),
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: C.gray800,
                      marginBottom: 6,
                    }}>
                      {m.poster_url
                        ? <Image source={{ uri: m.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16 }}>🎬</Text>
                          </View>
                      }
                    </View>
                    <Text style={{ color: C.white, fontSize: 10, fontWeight: '600', lineHeight: 13 }} numberOfLines={2}>
                      {m.title}
                    </Text>
                    {m.vote_average > 0 && (
                      <Text style={{ color: C.yellow, fontSize: 9, marginTop: 2 }}>
                        ★{m.vote_average.toFixed(1)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View
            onLayout={(event) => {
              reviewsSectionYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <ReviewsSection
              tmdbId={id}
              router={router}
              targetReviewId={targetReviewId}
              targetCommentId={targetCommentId}
              onFocusedReviewLayout={(reviewY) => {
                const scrollToReview = () => {
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, reviewsSectionYRef.current + reviewY - 80),
                    animated: true,
                  });
                };

                setTimeout(scrollToReview, 150);
                setTimeout(scrollToReview, 650);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sectionLbl: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLbl: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statVal: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  reviewsHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  reviewsTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
  },
  reviewsCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  signInReviewButton: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signInReviewText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewFormCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  reviewFormHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  reviewFormTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  reviewFormHint: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingStarButton: {
    height: 28,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingStar: {
    color: 'rgba(148,163,184,0.65)',
    fontSize: 18,
  },
  ratingStarActive: {
    color: '#facc15',
  },
  reviewInput: {
    backgroundColor: 'rgba(3,7,18,0.72)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    color: C.white,
    fontSize: 13,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reviewError: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 10,
  },
  reviewFormFooter: {
    gap: 12,
    marginTop: 12,
  },
  spoilerToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledControl: {
    opacity: 0.45,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 4,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  checkboxActive: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  checkboxTick: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  spoilerText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  reviewActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  postButton: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryButton: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  reviewNotice: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.24)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reviewNoticeText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  emptyReviewsCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 116,
    padding: 18,
  },
  emptyReviewsTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyReviewsText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  featuredReviewCard: {
    backgroundColor: 'rgba(239,13,26,0.08)',
    borderColor: 'rgba(239,13,26,0.35)',
  },
  focusedReviewCard: {
    backgroundColor: 'rgba(239,13,26,0.08)',
    borderColor: 'rgba(239,13,26,0.42)',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewAvatar: {
    alignItems: 'center',
    backgroundColor: '#db2777',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  reviewAvatarImage: {
    height: '100%',
    width: '100%',
  },
  reviewAvatarText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  reviewNameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  reviewUsername: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '800',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239,13,26,0.16)',
    borderColor: 'rgba(239,13,26,0.35)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    color: '#fecdd3',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewBody: {
    marginTop: 14,
  },
  reviewText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
  reviewMutedText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
  },
  spoilerCard: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.24)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  spoilerCardText: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewMetaBar: {
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    paddingTop: 10,
  },
  reviewMetaButton: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 28,
    minWidth: 28,
    justifyContent: 'center',
  },
  reviewMetaButtonActive: {
    backgroundColor: 'rgba(239,13,26,0.12)',
  },
  reviewMetaIcon: {
    color: '#94a3b8',
    fontSize: 20,
    lineHeight: 22,
  },
  reviewMetaIconActive: {
    color: C.red,
  },
  reviewCountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  likesText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  commentsPanel: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
  },
  noCommentsText: {
    color: '#64748b',
    fontSize: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 9,
  },
  commentAvatar: {
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 28,
  },
  commentAvatarImage: {
    height: '100%',
    width: '100%',
  },
  commentAvatarText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '800',
  },
  commentBubble: {
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  focusedCommentBubble: {
    backgroundColor: 'rgba(239,13,26,0.10)',
    borderColor: 'rgba(239,13,26,0.45)',
  },
  commentUsername: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },
  commentText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  commentError: {
    color: '#f87171',
    fontSize: 12,
  },
  commentComposer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    backgroundColor: 'rgba(3,7,18,0.72)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    color: C.white,
    flex: 1,
    fontSize: 12,
    minHeight: 40,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  commentPostButton: {
    alignItems: 'center',
    backgroundColor: C.red,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  commentPostText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  commentSignInHint: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  commentSignInHintText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
