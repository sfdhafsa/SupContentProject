import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api/axios";
import { firstPresent, formatMonthYear, formatShortDate, getYear } from "../../utils/format";

/* ── Icons ── */
const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
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
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 16 16" fill={filled ? "#F59E0B" : "none"} className="w-4 h-4">
    <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.1l-3.6 1.9.7-4L2.2 5.2l4-.6L8 1z"
      stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DotsIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <circle cx="4" cy="10" r="1.5"/>
    <circle cx="10" cy="10" r="1.5"/>
    <circle cx="16" cy="10" r="1.5"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-gray-300">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const FilmIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 7h16M2 13h16M6 4v3M6 13v3M10 4v3M10 13v3M14 4v3M14 13v3"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 2s-2.5 2.5-2.5 6S8 14 8 14M8 2s2.5 2.5 2.5 6S8 14 8 14M2 8h12"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const TABS = ["Overview", "Reviews", "Lists", "Stats"];

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}/>;
}

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

const formatActivity = (activity) => ({
  ...activity,
  date: formatShortDate(activity.created_at),
  review: activity.review ? formatReview(activity.review) : null,
});

export default function Profile() {
  const { user, loading } = useAuth(); // ← données complètes depuis AuthContext
  const navigate = useNavigate();

  const [tab, setTab]       = useState("Overview");
  const [followModal, setFollowModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [stats, setStats]   = useState({
    followers: 0, following: 0, movies_watched: 0, reviews: 0,
  });

  /* ── Derived values — directement depuis le contexte ── */
  const username    = user?.username    || "";
  const bio         = user?.bio         || "";
  const avatar      = user?.avatar_url  || null;
  const websiteUrl  = user?.website_url || null;
  const roles       = user?.roles       || [];
  const isAdmin     = roles.map((role) => String(role).toLowerCase()).includes("admin");
  const initials    = username.slice(0, 2).toUpperCase();
  const joinDate    = formatMonthYear(firstPresent(user?.created_at, user?.createdAt, user?.profile?.created_at));

  /* ── Fetch reviews quand dispo ── */
  useEffect(() => {
    if (!user || (tab !== "Reviews" && tab !== "Overview")) return;
    // TODO: décommenter quand l'endpoint sera prêt (Personne 4)
    // api.get("/reviews/me").then(res => setReviews(res.data.reviews));
  }, [tab, user]);

  /* ── Fetch lists quand dispo ── */
  useEffect(() => {
    if (!user || tab !== "Lists") return;
    // TODO: décommenter quand l'endpoint sera prêt (Personne 3)
    // api.get("/lists/me").then(res => setLists(res.data.lists));
  }, [tab, user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const [exportRes, activityRes, libraryRes, followersRes, followingRes] = await Promise.all([
          api.get("/users/me/export"),
          api.get(`/users/${user.id}/activity`),
          api.get("/library/stats"),
          api.get(`/social/follow/${user.id}/followers`),
          api.get(`/social/follow/${user.id}/following`),
        ]);

        const exportData = exportRes.data || {};
        const activeReviews = (exportData.reviews || []).filter((review) => !review.deleted_at);
        const customLists = exportData.custom_lists || [];
        const libraryStats = libraryRes.data?.data || {};

        setReviews(activeReviews.map(formatReview));
        setLists(customLists);
        setActivities((activityRes.data.activities || []).map(formatActivity));
        setFollowersList(followersRes.data?.followers || []);
        setFollowingList(followingRes.data?.following || []);
        setStats({
          followers: followersRes.data?.count || 0,
          following: followingRes.data?.count || 0,
          movies_watched: libraryStats.counts?.COMPLETED || libraryStats.totalMovies || 0,
          reviews: activeReviews.length,
        });
      } catch (err) {
        console.error("Profile activity error:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading ── */
  if (loading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-0 sm:px-4 py-5 sm:py-8">
        <div className="flex flex-col items-center gap-5 mb-8 sm:flex-row sm:items-start sm:gap-7">
          <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-full"/>
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

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 py-5 sm:py-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col items-center gap-5 mb-8 sm:flex-row sm:items-start sm:gap-7">

        {/* Avatar */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          {avatar
            ? <img src={avatar} alt={username} className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}/>
            : <UserIcon/>}
        </div>

        {/* Info */}
        <div className="flex-1 pt-2 w-full text-center sm:text-left">

          {/* Name + Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-1 sm:justify-start">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-all">{username}</h1>

            {isAdmin && (
              <span className="px-2 py-0.5 bg-[#D0021B]/10 text-[#D0021B] text-xs font-semibold rounded-full">
                Admin
              </span>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate("/admin-view")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
              >
                Admin view
              </button>
            )}

            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <EditIcon/> Edit Profile
            </button>

            <div className="relative">
              <button onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
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
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 text-sm text-[#D0021B] hover:underline mb-3 break-all">
              <GlobeIcon/> {websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}

          {joinDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Member since {joinDate}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6 sm:flex-wrap">
            {[
              { value: stats.followers,      label: "Followers", modal: "followers" },
              { value: stats.following,      label: "Following", modal: "following" },
              { value: stats.movies_watched, label: "Movies Watched" },
              { value: stats.reviews,        label: "Reviews" },
            ].map(({ value, label, modal }) => (
              <button
                key={label}
                type="button"
                onClick={() => modal && setFollowModal(modal)}
                disabled={!modal}
                className="flex flex-col items-center gap-0.5 text-center disabled:cursor-default sm:flex-row sm:items-baseline sm:gap-1.5 sm:text-left"
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
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              tab === t
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "Overview" && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Info</h2>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Email",       value: user?.email },
                { label: "Username",    value: `@${username}` },
                { label: "Bio",         value: bio || "—" },
                { label: "Website",     value: websiteUrl || "—" },
                { label: "Language",    value: user?.language_preference || "—" },
                { label: "Theme",       value: user?.theme_preference    || "—" },
                { label: "Roles",       value: roles.length ? roles.join(", ") : "user" },
                { label: "Member since",value: joinDate || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          {profileLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40"/>)}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState message="No recent activity yet." sub="Reviews, likes, comments and new lists will appear here."/>
          ) : (
            activities.slice(0, 5).map((item) => (
              <ActivityCard key={item.id} item={item} user={user} initials={initials}/>
            ))
          )}
        </div>
      )}

      {/* ══ REVIEWS ══ */}
      {tab === "Reviews" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Reviews</h2>
          {profileLoading
            ? <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40"/>)}</div>
            : reviews.length === 0
            ? <EmptyState message="No reviews yet." sub="Rate and review movies to see them here."/>
            : reviews.map((item) => <ReviewCard key={item.id} item={item} user={user} initials={initials} compact/>)
          }
        </div>
      )}

      {/* ══ LISTS ══ */}
      {tab === "Lists" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Lists</h2>
          {profileLoading
            ? <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20"/>)}</div>
            : lists.length === 0
            ? <EmptyState message="No lists yet." sub="Create lists to organise your movies."/>
            : lists.map((list) => (
              <div key={list.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FilmIcon/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{list.name}</p>
                    <p className="text-xs text-gray-400">{list.movie_count ?? list.movies?.length ?? 0} films</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  list.is_public
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                  {list.is_public ? "Public" : "Private"}
                </span>
              </div>
            ))
          }
        </div>
      )}

      {/* ══ STATS ══ */}
      {tab === "Stats" && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Movies Watched", value: stats.movies_watched },
              { label: "Hours Watched",  value: stats.movies_watched * 2 },
              { label: "Reviews",        value: stats.reviews },
              { label: "Lists",          value: lists.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Profile completeness */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Completeness</h3>
            {(() => {
              const checks = [
                { label: "Username set",    done: !!username },
                { label: "Bio added",       done: !!bio },
                { label: "Avatar uploaded", done: !!avatar },
                { label: "Website added",   done: !!websiteUrl },
              ];
              const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Completion</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D0021B] rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {checks.map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          {done
                            ? <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                                <path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"/>
                          }
                        </div>
                        <span className={done ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {followModal && (
        <FollowModal
          title={followModal === "followers" ? "Followers" : "Following"}
          users={followModal === "followers" ? followersList : followingList}
          loading={profileLoading}
          emptyMessage={followModal === "followers" ? "No followers yet." : "You are not following anyone yet."}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}

/* ── ReviewCard ── */
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

function ReviewCard({ item, user, initials, compact = false }) {
  const avatar = user?.avatar_url || null;
  const username = user?.username || "";
  const movieHref = item.movieId ? `/movies/${item.movieId}` : null;
  const movieContent = (
    <>
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {item.poster ? (
          <img src={item.poster} alt={item.movie} className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}/>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FilmIcon/>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#D0021B] transition-colors">{item.movie}</p>
        {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
      </div>
    </>
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
                : <span className="text-xs font-bold text-gray-500">{initials}</span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{username}</p>
              <p className="text-xs text-gray-400">@{username}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><DotsIcon/></button>
        </div>
      )}
      {movieHref ? (
        <Link to={movieHref} className="group flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors">
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
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">{item.review}</p>
    </div>
  );
}

/* ── EmptyState ── */
function ActivityCard({ item, user, initials }) {
  if (item.type === "REVIEW_CREATED") {
    return <ReviewCard item={item.review} user={user} initials={initials}/>;
  }

  if (item.type === "LIST_CREATED") {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Created a new list</p>
        <p className="mt-2 text-base font-bold text-[#D0021B]">{item.list?.name}</p>
        {item.list?.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.list.description}</p>}
        <p className="mt-2 text-xs text-gray-400">{item.list?.movie_count || 0} films · {item.date}</p>
      </div>
    );
  }

  const label = item.type === "REVIEW_LIKED" ? "Liked a review of" : "Commented on a review of";
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="font-semibold text-gray-900 dark:text-white">{label}</span>{" "}
        {item.review?.movie}
      </p>
      {item.comment?.text && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">“{item.comment.text}”</p>}
      <p className="mt-2 text-xs text-gray-400">{item.date}</p>
    </div>
  );
}

function EmptyState({ message, sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
        <FilmIcon/>
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <p className="text-xs text-gray-300 dark:text-gray-600">{sub}</p>
    </div>
  );
}
