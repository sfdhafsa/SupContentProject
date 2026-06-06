import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api/axios";
import ReviewComments from "../../components/reviews/ReviewComments.jsx";

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" className={`w-4 h-4 ${filled ? "text-yellow-400" : "text-gray-600"}`} fill="currentColor">
    <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77l-4.94 2.39.94-5.5-4-3.9 5.61-.92z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 22 22" className="w-6 h-6" fill={filled ? "currentColor" : "none"}>
    <path
      d="M11 18.5s-6.5-3.7-8.2-8A4.2 4.2 0 0110.2 6L11 7l.8-1a4.2 4.2 0 017.4 4.5c-1.7 4.3-8.2 8-8.2 8z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
    <path d="M5 16.5l-2 3V5.5A2.5 2.5 0 015.5 3h11A2.5 2.5 0 0119 5.5V14a2.5 2.5 0 01-2.5 2.5H5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
    <path d="M3 10.5L19 3l-4.2 16-4.1-6.8L3 10.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.7 12.2L19 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
    <path d="M6 4.5A1.5 1.5 0 017.5 3h7A1.5 1.5 0 0116 4.5v14L11 15l-5 3.5v-14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-4 h-4">
    <path d="M4 15.8V18h2.2L16.9 7.3l-2.2-2.2L4 15.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13.8 6l2.2 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-4 h-4">
    <path d="M5 7h12M9 10v6M13 10v6M8 7l.6-2h4.8L14 7M6 7l.8 11h8.4L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function RatingPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={`${star} stars`}
        >
          <StarIcon filled={star <= value} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ initialReview, submitting, error, onCancel, onSubmit }) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [text, setText] = useState(initialReview?.text || "");
  const [containsSpoiler, setContainsSpoiler] = useState(!!initialReview?.contains_spoiler);

  useEffect(() => {
    setRating(initialReview?.rating || 0);
    setText(initialReview?.text || "");
    setContainsSpoiler(!!initialReview?.contains_spoiler);
  }, [initialReview]);

  const canSubmit = rating > 0 && text.trim().length > 0 && !submitting;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit({ rating, text: text.trim(), contains_spoiler: containsSpoiler });
      }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white">{initialReview ? "Edit your review" : "Write a review"}</h3>
          <p className="text-xs text-gray-500 mt-1">Share your rating and thoughts with the community.</p>
        </div>
        <RatingPicker value={rating} onChange={setRating} />
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        maxLength={1200}
        placeholder="What did you think of this movie?"
        className="w-full rounded-xl border border-white/10 bg-gray-950/70 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-900/20 resize-none"
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={containsSpoiler}
            onChange={(event) => setContainsSpoiler(event.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-gray-950 accent-[#D0021B]"
          />
          Contains spoilers
        </label>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 transition-colors">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl bg-[#D0021B] text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b30218] transition-colors"
          >
            {submitting ? "Saving..." : initialReview ? "Save changes" : "Post review"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ReviewCard({ review, currentUserId, isAuthenticated, onEdit, onDelete, onLiked }) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(review.comments_count || 0);
  const isMine = String(review.user_id) === String(currentUserId);
  const initials = review.username ? review.username.slice(0, 2).toUpperCase() : "U";

  const toggleLike = async () => {
    if (!isAuthenticated || likeLoading) return;

    setLikeLoading(true);
    try {
      const res = await api.post(`/reviews/${review.id}/likes`);
      const nextLiked = res.data.status === "liked";
      setLiked(nextLiked);
      onLiked(review.id, nextLiked ? 1 : -1);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex gap-4">
        <Link to={`/profile/${review.user_id}`} className="w-11 h-11 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 ring-1 ring-white/10 hover:ring-[#D0021B] transition-all">
          {review.avatar_url ? (
            <img src={review.avatar_url} alt={review.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">{initials}</div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0">
              <Link to={`/profile/${review.user_id}`} className="text-sm font-bold text-white hover:text-[#D0021B] transition-colors">
                {review.username}
              </Link>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} />)}
              </div>
            </div>

            {isMine && (
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => onEdit(review)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Edit review">
                  <PencilIcon />
                </button>
                <button onClick={() => onDelete(review.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors" title="Delete review">
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            {review.contains_spoiler && !showSpoiler ? (
              <button
                type="button"
                onClick={() => setShowSpoiler(true)}
                className="w-full rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-left text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition-colors"
              >
                This review contains spoilers. Click to reveal.
              </button>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{review.text}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLike}
              disabled={!isAuthenticated || likeLoading}
              className={`flex items-center text-sm font-semibold transition-colors ${
                liked ? "text-[#D0021B]" : "text-gray-400 hover:text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Like"
            >
              <HeartIcon filled={liked} />
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((value) => !value)}
              className={`text-gray-400 hover:text-white transition-colors ${commentsOpen ? "text-white" : ""}`}
              title="Comment"
            >
              <CommentIcon />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors"
              title="Share"
            >
              <ShareIcon />
            </button>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors"
              title="Save"
            >
              <BookmarkIcon />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {(review.likes_count || 0) > 0 && (
              <p className="text-sm font-bold text-white">
                {review.likes_count} {review.likes_count === 1 ? "like" : "likes"}
              </p>
            )}
            {commentsCount > 0 && !commentsOpen && (
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                View {commentsCount === 1 ? "1 comment" : `all ${commentsCount} comments`}
              </button>
            )}
          </div>

          <ReviewComments
            reviewId={review.id}
            variant="dark"
            open={commentsOpen}
            initialCount={commentsCount}
            onCountChange={setCommentsCount}
          />
        </div>
      </div>
    </article>
  );
}

export default function ReviewsSection({ tmdbId }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const myReview = useMemo(
    () => reviews.find((review) => String(review.user_id) === String(user?.id)),
    [reviews, user?.id]
  );

  const loadReviews = () => {
    setLoading(true);
    api.get(`/reviews/movie/${tmdbId}`)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [tmdbId]);

  const submitReview = async (payload) => {
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingReview) {
        await api.patch(`/reviews/${editingReview.id}`, payload);
        setEditingReview(null);
      } else {
        await api.post("/reviews", { ...payload, tmdb_id: Number(tmdbId) });
      }
      await api.get(`/reviews/movie/${tmdbId}`).then((res) => setReviews(res.data || []));
    } catch (err) {
      setFormError(err?.response?.data?.message || "Unable to save this review.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    await api.delete(`/reviews/${reviewId}`);
    setReviews((items) => items.filter((item) => item.id !== reviewId));
    if (editingReview?.id === reviewId) setEditingReview(null);
  };

  const updateLikes = (reviewId, delta) => {
    setReviews((items) =>
      items.map((item) =>
        item.id === reviewId
          ? { ...item, likes_count: Math.max(0, (item.likes_count || 0) + delta) }
          : item
      )
    );
  };

  return (
    <section className="mt-12 max-w-screen-xl mx-auto px-4 sm:px-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">{reviews.length} community {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
        {!isAuthenticated && (
          <button onClick={() => navigate("/login")} className="px-4 py-2 rounded-xl bg-[#D0021B] text-sm font-bold text-white hover:bg-[#b30218] transition-colors">
            Sign in to review
          </button>
        )}
      </div>

      {isAuthenticated && (!myReview || editingReview) && (
        <div className="mb-5">
          <ReviewForm
            initialReview={editingReview}
            submitting={submitting}
            error={formError}
            onCancel={editingReview ? () => { setEditingReview(null); setFormError(null); } : null}
            onSubmit={submitReview}
          />
        </div>
      )}

      {isAuthenticated && myReview && !editingReview && (
        <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-200">
          You already reviewed this movie. Use the edit button on your review to update it.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-36 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center">
          <p className="text-base font-bold text-white">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to share your thoughts about this movie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              isAuthenticated={isAuthenticated}
              onEdit={setEditingReview}
              onDelete={deleteReview}
              onLiked={updateLikes}
            />
          ))}
        </div>
      )}
    </section>
  );
}
