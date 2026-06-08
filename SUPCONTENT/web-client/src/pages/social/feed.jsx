import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api/axios.js";
import ReviewComments from "../../components/reviews/ReviewComments.jsx";
import { getYear } from "../../utils/format.js";

/* ── Icons ── */
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 14 14" fill={filled ? "#F59E0B" : "none"} className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M7 1l1.6 3.2 3.5.5-2.5 2.5.6 3.5L7 9 3.8 10.7l.6-3.5L2 4.7l3.5-.5L7 1z"
      stroke="#F59E0B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" fill={filled ? "#D0021B" : "none"} className="w-5 h-5">
    <path d="M10 17s-7-4.5-7-9a4 4 0 017-2.65A4 4 0 0117 8c0 4.5-7 9-7 9z"
      stroke={filled ? "#D0021B" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path d="M4 14.5l-1.5 2.2V5A2 2 0 014.5 3h11A2 2 0 0117.5 5v8.5a2 2 0 01-2 2H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const FilmIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
    <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 7h16M2 13h16M6 4v3M6 13v3M10 4v3M10 13v3M14 4v3M14 13v3"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const CollectionIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
    <rect x="2" y="6" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6 6V4.5A1.5 1.5 0 017.5 3h5A1.5 1.5 0 0114 4.5V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M2 10h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M4 4v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.06 13A7 7 0 1010 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

/* ── Skeleton ── */
function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800"/>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-48"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-24"/>
            </div>
          </div>
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="w-12 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0"/>
            <div className="flex flex-col gap-2 flex-1 justify-center">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg w-32"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-20"/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ user, size = "sm" }) {
  const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const txt = size === "sm" ? "text-xs" : "text-sm";
  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className={`${dim} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700`}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}/>
        : <span className={`${txt} font-bold text-gray-500 dark:text-gray-400`}>{initials}</span>
      }
    </div>
  );
}

/* ── Star Rating ── */
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} filled={s <= rating} />
      ))}
    </div>
  );
}

/* ── Movie Card ── */
function MovieCard({ movie }) {
  if (!movie) return null;
  const movieHref = movie.external_id ? `/movies/${movie.external_id}` : null;
  const releaseYear = getYear(movie.release_date);
  const content = (
    <>
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}/>
          : <FilmIcon />
        }
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#D0021B] transition-colors">{movie.title}</p>
        {releaseYear && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {releaseYear}
          </p>
        )}
      </div>
    </>
  );

  if (movieHref) {
    return (
      <Link to={movieHref} className="group flex gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
      {content}
    </div>
  );
}

/* ── Activity Badge ── */
function ActivityBadge({ type }) {
  const config = {
    REVIEW_CREATED:        { label: "Review",     color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
    RATING_GIVEN:          { label: "Rating",     color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
    COLLECTION_MOVIE_ADDED:{ label: "Collection", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
  };
  const { label, color } = config[type] || { label: type, color: "bg-gray-100 text-gray-500" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

/* ── Feed Item ── */
function FeedItem({ item }) {
  const [liked, setLiked]       = useState(item.review?.has_liked || false);
  const [likesCount, setLikesCount] = useState(item.review?.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(item.review?.comments_count || 0);

  const isReview     = item.type === "REVIEW_CREATED";
  const isRating     = item.type === "RATING_GIVEN";
  const isCollection = item.type === "COLLECTION_MOVIE_ADDED";
  const collectionHref = isCollection && item.collection?.id ? `/lists/${item.collection.id}` : null;

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const timestamp = date.getTime();
    if (Number.isNaN(timestamp)) return "";

    const diff = Date.now() - timestamp;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLike = async () => {
    if (likeLoading || !item.review?.id) return;
    setLikeLoading(true);
    try {
      const res = await api.post(`/reviews/${item.review.id}/likes`);
      const nextLiked = res.data.status === "liked";
      setLiked(nextLiked);
      setLikesCount((count) =>
        Number.isFinite(Number(res.data.count))
          ? Number(res.data.count)
          : Math.max(0, count + (nextLiked ? 1 : -1))
      );
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 transition-all hover:border-gray-200 dark:hover:border-gray-700">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${item.author?.id}`}>
            <Avatar user={item.author} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${item.author?.id}`}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#D0021B] transition-colors">
                {item.author?.username}
              </Link>
              <ActivityBadge type={item.type} />
            </div>
            {timeAgo(item.activity?.created_at) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {timeAgo(item.activity?.created_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Headline ── */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
        {item.activity?.headline}
      </p>

      {/* ── Rating ── */}
      {(isReview || isRating) && item.review?.rating && (
        <div className="mb-3">
          <StarRating rating={item.review.rating} />
        </div>
      )}

      {/* ── Movie card ── */}
      <div className="mb-3">
        <MovieCard movie={item.movie} />
      </div>

      {/* ── Collection info ── */}
      {isCollection && item.collection && (
        collectionHref ? (
          <Link
            to={collectionHref}
            className="flex items-center gap-2 mb-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            aria-label={`Open ${item.collection.name} collection`}
          >
            <CollectionIcon />
            <div>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">{item.collection.name}</p>
              {item.collection.description && (
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5 line-clamp-1">
                  {item.collection.description}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <CollectionIcon />
            <div>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">{item.collection.name}</p>
              {item.collection.description && (
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5 line-clamp-1">
                  {item.collection.description}
                </p>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Review text ── */}
      {isReview && item.review?.text && (
        <div className="mb-3">
          {item.review.contains_spoiler && !showSpoiler ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠️ Contains spoilers</p>
              <button onClick={() => setShowSpoiler(true)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline">
                Show anyway
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3">
              {item.review.text}
            </p>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      {(isReview || isRating) && item.review?.id && (
        <>
          <div className="flex items-center pt-1">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`transition-all ${
                  liked ? "text-[#D0021B]" : "text-gray-700 dark:text-gray-300 hover:text-[#D0021B]"
                } disabled:opacity-50`}
                title="Like"
              >
                <HeartIcon filled={liked} />
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen((value) => !value)}
                className={`transition-colors ${
                  commentsOpen ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Comment"
              >
                <CommentIcon />
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {likesCount > 0 && (
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </p>
            )}
            {commentsCount > 0 && !commentsOpen && (
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                View {commentsCount === 1 ? "1 comment" : `all ${commentsCount} comments`}
              </button>
            )}
          </div>

          <ReviewComments
            reviewId={item.review.id}
            initialCount={commentsCount}
            open={commentsOpen}
            onCountChange={setCommentsCount}
          />
        </>
      )}
    </div>
  );
}

/* ── Empty state ── */
function EmptyFeed() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-16 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
        <UserIcon />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your feed is empty</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
        Follow other users to see their reviews, ratings and collections here.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN FEED PAGE
══════════════════════════════════════ */
export default function Feed({ embedded = false }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]         = useState("");
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 20;
  const loaderRef = useRef(null);

  /* ── Fetch feed ── */
  const fetchFeed = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (!reset) setLoadingMore(true);

    try {
      const res = await api.get("/social/feed", {
        params: { limit: LIMIT, offset: currentOffset },
      });

      const newItems = res.data.items || [];

      if (reset) {
        setItems(newItems);
        setOffset(LIMIT);
      } else {
        setItems((prev) => [...prev, ...newItems]);
        setOffset((prev) => prev + LIMIT);
      }

      setHasMore(newItems.length === LIMIT);
    } catch (err) {
      setError("Failed to load feed. Please try again.");
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [offset]);

  /* ── Initial load ── */
  useEffect(() => {
    fetchFeed(true);
  }, []);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          fetchFeed(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchFeed]);

  /* ── Refresh ── */
  const handleRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    setError("");
    await fetchFeed(true);
  };

  return (
    <div className={embedded ? "w-full" : "max-w-2xl mx-auto px-4 py-8"}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Latest from people you follow
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${
            refreshing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          {error}
          <button onClick={handleRefresh} className="font-semibold hover:underline ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <FeedSkeleton />}

      {/* Items */}
      {!loading && (
        <>
          {items.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <FeedItem key={`${item.type}-${item.review?.id || item.collection?.id}-${idx}`} item={item} />
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loaderRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="w-6 h-6 border-2 border-[#D0021B] border-t-transparent rounded-full animate-spin"/>
              )}
            </div>
          )}

          {/* End of feed */}
          {!hasMore && items.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 dark:text-gray-500">You're all caught up 🎉</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
