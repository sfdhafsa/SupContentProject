import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api/axios";
import { firstPresent, formatMonthYear, formatShortDate, getYear } from "../../utils/format";

/* ── Icons ── */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-gray-300">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 2s-2.5 2.5-2.5 6S8 14 8 14M8 2s2.5 2.5 2.5 6S8 14 8 14M2 8h12"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 16 16" fill={filled ? "#F59E0B" : "none"} className="w-4 h-4">
    <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.1l-3.6 1.9.7-4L2.2 5.2l4-.6L8 1z"
      stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const FilmIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 7h16M2 13h16M6 4v3M6 13v3M10 4v3M10 13v3M14 4v3M14 13v3"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="15" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="15" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6.5 9.1l7-4.2M6.5 10.9l7 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const UserPlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M15 8v5M17.5 10.5h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const UserCheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M14 12l1.5 1.5L18 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Skeleton ── */
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}/>;
}

/* ── Empty state ── */
function EmptyState({ message, sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
        <FilmIcon/>
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <p className="text-xs text-gray-300 dark:text-gray-600">{sub}</p>
    </div>
  );
}

const TABS = ["Overview", "Reviews", "Lists"];

const formatReview = (review) => ({
  id: review.id,
  movieId: review.external_id,
  poster: review.poster_url,
  movie: review.title,
  year: getYear(firstPresent(review.release_date, review.release_year, review.year)),
  rating: Number(review.rating || 0),
  date: formatShortDate(firstPresent(review.created_at, review.updated_at)),
  review: review.text || "Rated this movie.",
});

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [tab, setTab]               = useState("Overview");
  const [followModal, setFollowModal] = useState(null);
  const [copied, setCopied]         = useState(false);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [lists, setLists]   = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    movies_watched: 0,
    reviews: 0,
  });

  /* ── Fetch public profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.user);
      } catch (err) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error("Failed to load profile:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  /* ── Redirect to own profile if viewing self ── */
  useEffect(() => {
    if (currentUser && profile && currentUser.id === profile.id) {
      navigate("/profile", { replace: true });
    }
  }, [currentUser, navigate, profile]);

  useEffect(() => {
    if (!isAuthenticated || !id || currentUser?.id === id) return;

    api.get(`/social/follow/${id}/follow-status`)
      .then((res) => setIsFollowing(!!res.data.isFollowing))
      .catch((err) => console.error("Follow status error:", err));
  }, [currentUser, id, isAuthenticated]);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const [res, followersRes, followingRes] = await Promise.all([
          api.get(`/users/${id}/activity`),
          api.get(`/social/follow/${id}/followers`),
          api.get(`/social/follow/${id}/following`),
        ]);
        setReviews((res.data.reviews || []).map(formatReview));
        setLists(res.data.lists || []);
        setFollowersList(followersRes.data.followers || []);
        setFollowingList(followingRes.data.following || []);
        setStats({
          followers: followersRes.data.count || res.data.stats?.followers || 0,
          following: followingRes.data.count || res.data.stats?.following || 0,
          movies_watched: res.data.stats?.movies_watched || 0,
          reviews: res.data.stats?.reviews || 0,
        });
      } catch (err) {
        console.error("Public profile activity error:", err);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  /* ── Derived values ── */
  const username   = profile?.username   || "";
  const bio        = profile?.bio        || "";
  const avatar     = profile?.avatar_url || null;
  const websiteUrl = profile?.website_url || null;
  const roles      = profile?.roles      || [];
  const joinDate   = formatMonthYear(firstPresent(profile?.created_at, profile?.createdAt));

  const isOwnProfile = currentUser?.id === profile?.id;

  /* ── Share ── */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Follow / Unfollow ── */
  const handleFollow = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setFollowLoading(true);
    try {
      const res = await api.post(`/social/follow/${id}`);
      const nextFollowing = res.data.status === "followed";
      setIsFollowing(nextFollowing);
      setStats((current) => ({
        ...current,
        followers: Number.isFinite(Number(res.data.count))
          ? Number(res.data.count)
          : Math.max(0, current.followers + (nextFollowing ? 1 : -1)),
      }));
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-7 mb-8">
          <Skeleton className="w-36 h-36 rounded-full"/>
          <div className="flex-1 pt-2 flex flex-col gap-3">
            <Skeleton className="w-48 h-8"/>
            <Skeleton className="w-32 h-4"/>
            <Skeleton className="w-full h-4"/>
            <div className="flex gap-6 mt-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="w-20 h-5"/>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <UserIcon/>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User not found</h2>
        <p className="text-sm text-gray-400">This profile doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <BackIcon/> Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-6"
      >
        <BackIcon/> Back
      </button>

      {/* ── HEADER ── */}
      <div className="flex items-start gap-7 mb-8">

        {/* Avatar */}
        <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          {avatar
            ? <img src={avatar} alt={username} className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}/>
            : <UserIcon/>}
        </div>

        {/* Info */}
        <div className="flex-1 pt-2">

          {/* Name + actions */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{username}</h1>

            {roles.includes("admin") && (
              <span className="px-2 py-0.5 bg-[#D0021B]/10 text-[#D0021B] text-xs font-semibold rounded-full">
                Admin
              </span>
            )}

            {/* Follow button — only if not own profile and authenticated */}
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isFollowing
                    ? "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200"
                    : "bg-[#D0021B] hover:bg-[#b30218] text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isFollowing ? <><UserCheckIcon/> Ne plus suivre</> : <><UserPlusIcon/> Suivre</>}
              </button>
            )}

            {/* Share */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <ShareIcon/>
              </button>
              {copied && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                  Copied!
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">@{username}</p>

          {bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{bio}</p>
          )}

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#D0021B] hover:underline mb-3"
            >
              <GlobeIcon/> {websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}

          {joinDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Member since {joinDate}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { value: stats.followers, label: "Followers", modal: "followers" },
              { value: stats.following, label: "Following", modal: "following" },
              { value: stats.movies_watched, label: "Movies Watched" },
              { value: stats.reviews, label: "Reviews" },
            ].map(({ value, label, modal }) => (
              <button
                key={label}
                type="button"
                onClick={() => modal && setFollowModal(modal)}
                disabled={!modal}
                className="flex items-baseline gap-1.5 text-left disabled:cursor-default"
              >
                <span className="text-base font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</span>
                <span className={`text-sm ${modal ? "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" : "text-gray-400 dark:text-gray-500"}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-6"/>

      {/* ── TABS ── */}
      <div className="flex gap-1 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "Overview" && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">About</h2>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Username",     value: `@${username}` },
                { label: "Member since", value: joinDate || "—" },
                { label: "Bio",          value: bio || "—" },
                { label: "Website",      value: websiteUrl || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          {activityLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40"/>)}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState message="No activity yet." sub="This user hasn't reviewed any movies yet."/>
          ) : (
            reviews.slice(0, 3).map((item) => <ReviewCard key={item.id} item={item}/>)
          )}
        </div>
      )}

      {/* ══ REVIEWS ══ */}
      {tab === "Reviews" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reviews</h2>
          {activityLoading
            ? <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40"/>)}</div>
            : reviews.length === 0
            ? <EmptyState message="No reviews yet." sub="This user hasn't reviewed any movies yet."/>
            : reviews.map((item) => <ReviewCard key={item.id} item={item}/>)
          }
        </div>
      )}

      {/* ══ LISTS ══ */}
      {tab === "Lists" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Public Lists</h2>
          {activityLoading
            ? <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20"/>)}</div>
            : lists.length === 0
            ? <EmptyState message="No public lists." sub="This user hasn't created any public lists yet."/>
            : lists.map((list) => (
              <div key={list.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FilmIcon/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{list.name}</p>
                    <p className="text-xs text-gray-400">{list.movie_count ?? 0} films</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600">
                  Public
                </span>
              </div>
            ))
          }
        </div>
      )}

      {followModal && (
        <FollowModal
          title={followModal === "followers" ? "Followers" : "Following"}
          users={followModal === "followers" ? followersList : followingList}
          loading={activityLoading}
          emptyMessage={followModal === "followers" ? "No followers yet." : "This user does not follow anyone yet."}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}

function FollowModal({ title, users, loading, emptyMessage, onClose }) {
  const [query, setQuery] = useState("");
  const filteredUsers = users.filter((item) => {
    const text = `${item.username || ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 py-6" onClick={onClose}>
      <div
        className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-gray-100 px-6 py-4 text-center dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-3xl leading-none text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-50 p-4 dark:border-gray-800">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:focus:ring-gray-700"
          />
        </div>

        <div className="min-h-48 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex flex-col gap-3 py-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16"/>)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">{query ? "No results." : emptyMessage}</div>
          ) : (
            filteredUsers.map((item) => <FollowUserRow key={item.id} user={item} onClose={onClose}/>)
          )}
        </div>
      </div>
    </div>
  );
}

function FollowUserRow({ user, onClose }) {
  const initials = (user.username || "U").slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/profile/${user.id}`}
      onClick={onClose}
      className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover"/>
        ) : (
          <span className="text-xs font-bold text-gray-500">{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user.username}</p>
        <p className="truncate text-xs text-gray-400">@{user.username}</p>
      </div>
    </Link>
  );
}

function ReviewCard({ item }) {
  const movieHref = item.movieId ? `/movies/${item.movieId}` : null;
  const movieContent = (
    <>
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.movie}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FilmIcon/>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#D0021B] transition-colors">
          {item.movie}
        </p>
        {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
      </div>
    </>
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
      {movieHref ? (
        <Link
          to={movieHref}
          className="group flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
        >
          {movieContent}
        </Link>
      ) : (
        <div className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3">
          {movieContent}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => <StarIcon key={s} filled={s <= item.rating}/>)}
        </div>
        {item.date && <span className="text-xs text-gray-400">{item.date}</span>}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
        {item.review}
      </p>
    </div>
  );
}
