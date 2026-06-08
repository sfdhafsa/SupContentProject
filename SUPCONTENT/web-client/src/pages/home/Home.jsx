import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api/axios.js";
import ReviewComments from "../../components/reviews/ReviewComments.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import AddToLibraryButton from "../../components/library/AddToLibraryButton.jsx";

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 14 14" fill={filled ? "#F59E0B" : "none"} className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M7 1l1.6 3.2 3.5.5-2.5 2.5.6 3.5L7 9 3.8 10.7l.6-3.5L2 4.7l3.5-.5L7 1z"
      stroke="#F59E0B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" fill={filled ? "#D0021B" : "none"} className="w-4 h-4">
    <path d="M10 17s-7-4.5-7-9a4 4 0 017-2.65A4 4 0 0117 8c0 4.5-7 9-7 9z"
      stroke={filled ? "#D0021B" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path d="M2.8 9.5L17 3l-3.8 14-3.5-6L2.8 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.7 11L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const FeedBookmarkIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path d="M5.5 3.5A1.5 1.5 0 017 2h6a1.5 1.5 0 011.5 1.5V17L10 13.8 5.5 17V3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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
const UserIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

/* ══════════════════════════════════════
   FEED COMPONENTS
══════════════════════════════════════ */

/* Skeleton */
function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800"/>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-36 sm:w-56"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-24"/>
            </div>
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-3/4 mb-3"/>
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="w-16 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0"/>
            <div className="flex flex-col gap-2 flex-1 justify-center">
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-32"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-20"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-16"/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Avatar */
function Avatar({ user }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}/>
        : <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{initials}</span>
      }
    </div>
  );
}

/* Headline avec parties en gras */
function Headline({ item, currentUser }) {
  const author = item.author?.username || "";
  const movie  = item.movie?.title     || "";
  const isViewerReviewAuthor = String(item.review_author?.id) === String(currentUser?.id);

  if (item.type === "REVIEW_CREATED") {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <Link to={`/profile/${item.author?.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#D0021B]">
          {author}
        </Link>
        {" reviewed "}
        <span className="font-bold text-gray-900 dark:text-white">{movie}</span>
      </p>
    );
  }
  if (item.type === "RATING_GIVEN") {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-wrap">
        <Link to={`/profile/${item.author?.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#D0021B]">
          {author}
        </Link>
        {" rated "}
        <span className="font-bold text-gray-900 dark:text-white">{movie}</span>
        {item.review?.rating && (
          <span className="flex items-center gap-0.5">
            {item.review.rating}
            <StarIcon filled={true} />
          </span>
        )}
      </p>
    );
  }
  if (item.type === "COLLECTION_MOVIE_ADDED") {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <Link to={`/profile/${item.author?.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#D0021B]">
          {author}
        </Link>
        {" added "}
        <span className="font-bold text-gray-900 dark:text-white">{movie}</span>
        {" to "}
        <span className="font-bold text-gray-900 dark:text-white">{item.collection?.name}</span>
      </p>
    );
  }
  if (item.type === "REVIEW_COMMENTED") {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <Link to={`/profile/${item.author?.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#D0021B]">
          {author}
        </Link>
        {" commented on "}
        {isViewerReviewAuthor ? (
          <span className="font-bold text-gray-900 dark:text-white">your</span>
        ) : item.review_author?.id ? (
          <>
            <Link to={`/profile/${item.review_author.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#D0021B]">
              {item.review_author.username}
            </Link>
            {"'s"}
          </>
        ) : (
          <span className="font-bold text-gray-900 dark:text-white">a user's</span>
        )}
        {" review of "}
        <span className="font-bold text-gray-900 dark:text-white">{movie}</span>
      </p>
    );
  }
  return <p className="text-sm text-gray-700 dark:text-gray-300">{item.activity?.headline}</p>;
}

/* Movie card — style Figma avec grand poster */
function MovieCard({ movie, rating }) {
  if (!movie) return null;
  const movieHref = movie.external_id ? `/movies/${movie.external_id}` : null;
  const content = (
    <>
      {/* Poster */}
      <div className="w-16 h-[88px] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover"/>
          : <FilmIcon />
        }
      </div>
      {/* Info */}
      <div className="flex flex-col justify-center gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-[#D0021B] transition-colors">{movie.title}</p>
        {movie.release_date && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(movie.release_date).getFullYear()}</p>
        )}
        {rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <StarIcon filled={true} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{rating}</span>
          </div>
        )}
      </div>
    </>
  );

  if (movieHref) {
    return (
      <Link to={movieHref} className="group flex gap-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex gap-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3">
      {content}
    </div>
  );
}

/* Feed Item — style Figma */
function FeedItem({ item, currentUser }) {
  const [liked, setLiked]           = useState(item.review?.has_liked || false);
  const [likesCount, setLikesCount] = useState(item.review?.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(item.review?.comments_count || 0);

  const isReview     = item.type === "REVIEW_CREATED";
  const isRating     = item.type === "RATING_GIVEN";
  const isCollection = item.type === "COLLECTION_MOVIE_ADDED";
  const isComment    = item.type === "REVIEW_COMMENTED";

  const getActivityDate = () =>
    item.activity?.created_at ||
    item.review?.created_at ||
    item.comment?.created_at ||
    item.collection?.added_at;

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const timestamp = date.getTime();

    if (Number.isNaN(timestamp)) return "";

    const diff  = Date.now() - timestamp;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const activityTimeLabel = timeAgo(getActivityDate());

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
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 transition-all">

      {/* Header — Avatar + infos + icon */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${item.author?.id}`}>
            <Avatar user={item.author} />
          </Link>
          <div className="min-w-0">
            <Headline item={item} currentUser={currentUser} />
            {activityTimeLabel && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {activityTimeLabel}
              </p>
            )}
          </div>
        </div>

        {/* Icon droite — couleur selon type */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isReview     ? "text-blue-400"  :
          isRating     ? "text-amber-400" :
          isComment    ? "text-blue-400"  :
          isCollection ? "text-purple-400": "text-gray-400"
        }`}>
          {isReview     ? <CommentIcon /> :
           isRating     ? <StarIcon filled={true} /> :
           isComment    ? <CommentIcon /> :
           isCollection ? <CollectionIcon /> : null
          }
        </div>
      </div>

      {/* Review or comment text */}
      {((isReview && item.review?.text) || (isComment && item.comment?.text)) && (
        <div className="mb-3 sm:ml-[52px]">
          {isReview && item.review.contains_spoiler && !showSpoiler ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠️ Contains spoilers</p>
              <button onClick={() => setShowSpoiler(true)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline">
                Show anyway
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
              {isComment ? item.comment.text : item.review.text}
            </p>
          )}
        </div>
      )}

      {/* Movie card */}
      <div className="sm:ml-[52px] mb-4">
        <MovieCard movie={item.movie} rating={item.review?.rating} />
      </div>

      {/* Collection badge */}
      {isCollection && item.collection && (
        <div className="sm:ml-[52px] flex items-center gap-2 mb-4 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <CollectionIcon />
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">{item.collection.name}</p>
        </div>
      )}

      {/* Actions */}
      {(isReview || isRating || isComment) && item.review?.id && (
        <div className="sm:ml-[52px]">
          <div className="flex items-center justify-between">
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
              <button type="button" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Share">
                <ShareIcon />
              </button>
            </div>
            <button type="button" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Save">
              <FeedBookmarkIcon />
            </button>
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
        </div>
      )}
    </div>
  );
}

/* Empty feed */
function EmptyFeed() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 sm:p-16 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <UserIcon />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">Your feed is empty</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
        Follow other users to see their reviews, ratings and collections here.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════
   TRENDING SECTION (sidebar droite)
══════════════════════════════════════ */
function TrendingCard({ movie }) {
  const movieId = movie.tmdb_id || movie.external_id || movie.id;
  const tmdbId = movie.tmdb_id || movie.external_id || movie.id;
  const movieHref = movieId ? `/movies/${movieId}` : "#";

  return (
    <article className="relative rounded-2xl overflow-visible aspect-[2/3] bg-gray-200 dark:bg-gray-800 group hover:ring-2 hover:ring-[#D0021B] transition-all">
      <Link to={movieHref} aria-label={`Open ${movie.title}`} className="block h-full overflow-hidden rounded-2xl">
      {movie.poster_url
        ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        : <div className="w-full h-full flex items-center justify-center"><FilmIcon /></div>
      }
      {/* Rating badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
        <StarIcon filled={true} />
        <span className="text-white text-xs font-bold">{movie.vote_average?.toFixed(1) || "—"}</span>
      </div>
      </Link>

      <AddToLibraryButton
        movieId={null}
        tmdbId={tmdbId}
        variant="icon"
        className="absolute top-2 right-2 z-20"
      />
    </article>
  );
}

function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="aspect-[2/3] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   HOME PAGE
══════════════════════════════════════ */
const formatStat = (value) => Number(value || 0).toLocaleString("en-US");

function StatsCard({ stats, loading }) {
  const rows = [
    { label: "Movies Watched", value: stats.moviesWatched },
    { label: "Reviews Written", value: stats.reviewsWritten },
    { label: "Lists Created", value: stats.listsCreated },
    { label: "Followers", value: stats.followers },
  ];

  return (
    <section className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Stats</h2>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
            {loading ? (
              <span className="h-4 w-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : (
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatStat(row.value)}</span>
            )}
          </div>
        ))}
      </div>

      <Link
        to="/profile"
        className="mt-6 flex h-11 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        View Profile
      </Link>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();

  /* Feed state */
  const [items, setItems]               = useState([]);
  const [feedLoading, setFeedLoading]   = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [feedError, setFeedError]       = useState("");
  const [offset, setOffset]             = useState(0);
  const [hasMore, setHasMore]           = useState(true);
  const [feedOrder, setFeedOrder]       = useState("desc");

  /* Trending state */
  const [trending, setTrending]         = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    reviewsWritten: 0,
    listsCreated: 0,
    followers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const LIMIT     = 20;
  const loaderRef = useRef(null);
  const previousFeedOrderRef = useRef(feedOrder);

  /* ── Fetch feed ── */
  const fetchFeed = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setFeedLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get("/social/feed", {
        params: { limit: LIMIT, offset: currentOffset, order: feedOrder },
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
      setFeedError("Failed to load feed.");
      console.error("Feed error:", err);
    } finally {
      setFeedLoading(false);
      setLoadingMore(false);
    }
  }, [feedOrder, offset]);

  /* ── Fetch popular movies ── */
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/movies/popular");
        setTrending(res.data.data?.results || res.data.results || res.data.movies || []);
      } catch (err) {
        console.error("Trending error:", err);
      } finally {
        setTrendingLoading(false);
      }
    };
    const fetchStats = async () => {
      if (!user?.id) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);
      try {
        const [libraryRes, exportRes, followersRes] = await Promise.all([
          api.get("/library/stats"),
          api.get("/users/me/export"),
          api.get(`/social/follow/${user.id}/followers`),
        ]);

        const libraryStats = libraryRes.data.data || {};
        setStats({
          moviesWatched: libraryStats.counts?.COMPLETED || libraryStats.totalMovies || 0,
          reviewsWritten: exportRes.data.reviews?.filter((review) => !review.deleted_at).length || 0,
          listsCreated: exportRes.data.custom_lists?.length || 0,
          followers: followersRes.data.count || 0,
        });
      } catch (err) {
        console.error("Stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchTrending();
    fetchStats();
    fetchFeed(true);
  }, [user?.id]);

  useEffect(() => {
    if (previousFeedOrderRef.current === feedOrder) return;

    previousFeedOrderRef.current = feedOrder;
    setOffset(0);
    setHasMore(true);
    setFeedError("");
    fetchFeed(true);
  }, [feedOrder]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) fetchFeed(false);
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchFeed]);

  const handleRetry = async () => {
    setOffset(0);
    setHasMore(true);
    setFeedError("");
    await fetchFeed(true);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* ══ LEFT — ACTIVITY FEED ══ */}
        <div>
          {/* Feed header */}
          <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
            <div
              className="grid h-10 w-full grid-cols-2 rounded-2xl border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900 sm:w-auto"
              role="group"
              aria-label="Feed order"
            >
              {[
                { value: "desc", label: "Newest" },
                { value: "asc", label: "Oldest" },
              ].map((option) => {
                const isActive = feedOrder === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFeedOrder(option.value)}
                    className={`min-w-24 rounded-xl px-4 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-[#D0021B] shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {feedError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600 flex items-center justify-between">
              {feedError}
              <button onClick={handleRetry} className="font-semibold hover:underline ml-2">Retry</button>
            </div>
          )}

          {/* Skeleton */}
          {feedLoading && <FeedSkeleton />}

          {/* Items */}
          {!feedLoading && (
            <>
              {items.length === 0
                ? <EmptyFeed />
                : (
                  <div className="flex flex-col gap-4">
                    {items.map((item, idx) => (
                      <FeedItem
                        key={`${item.type}-${item.review?.id || item.collection?.id}-${idx}`}
                        item={item}
                        currentUser={user}
                      />
                    ))}
                  </div>
                )
              }

              {/* Infinite scroll */}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center py-8">
                  {loadingMore && (
                    <div className="w-6 h-6 border-2 border-[#D0021B] border-t-transparent rounded-full animate-spin"/>
                  )}
                </div>
              )}

            </>
          )}
        </div>

        {/* ══ RIGHT — TRENDING NOW ══ */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Popular Movies</h2>
            <Link to="/discover" className="text-sm font-semibold text-[#D0021B] hover:underline">
              See all
            </Link>
          </div>

          {trendingLoading ? (
            <TrendingSkeleton />
          ) : trending.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400">No popular movies available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trending.slice(0, 6).map((movie, idx) => (
                <TrendingCard key={movie.id || idx} movie={movie} />
              ))}
            </div>
          )}

          <StatsCard stats={stats} loading={statsLoading} />
        </div>

      </div>
    </div>
  );
}
