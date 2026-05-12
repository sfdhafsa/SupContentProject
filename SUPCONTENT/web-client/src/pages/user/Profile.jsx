import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api/axios";

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
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
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

/* ── Skeleton loader ── */
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}/>;
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Overview");
  const [copied, setCopied] = useState(false);

  // Real user data from /users/me
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Stats (à connecter quand les endpoints seront prêts)
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    movies_watched: 0,
    reviews: 0,
  });

  // Reviews (à connecter à l'endpoint reviews quand dispo)
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Lists (à connecter à l'endpoint lists quand dispo)
  const [lists, setLists] = useState([]);

  /* ── Fetch user data ── */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUserData(res.data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
        // Fallback to AuthContext user
        setUserData(authUser);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  /* ── Fetch reviews when tab active ── */
  useEffect(() => {
    if (tab !== "Reviews" && tab !== "Overview") return;
    // TODO: connecter à GET /reviews?userId=me quand endpoint prêt
    // const res = await api.get("/reviews/me");
    // setReviews(res.data.reviews);
  }, [tab]);

  /* ── Derived values ── */
  const user = userData || authUser;
  const username     = user?.username    || "";
  const displayName  = user?.username    || ""; // pas de display_name dans le schema
  const bio          = user?.bio         || "";
  const avatar       = user?.avatar_url  || null;
  const websiteUrl   = user?.website_url || null;
  const joinDate     = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const roles        = user?.roles       || [];
  const initials     = username.slice(0, 2).toUpperCase();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading skeleton ── */
  if (loadingUser) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── HEADER ── */}
      <div className="flex items-start gap-7 mb-8">

        {/* Avatar */}
        <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          {avatar
            ? <img src={avatar} alt={username} className="w-full h-full object-cover"/>
            : <UserIcon/>}
        </div>

        {/* Info */}
        <div className="flex-1 pt-2">

          {/* Name + Actions */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>

            {/* Role badge */}
            {roles.includes("admin") && (
              <span className="px-2 py-0.5 bg-[#D0021B]/10 text-[#D0021B] text-xs font-semibold rounded-full">
                Admin
              </span>
            )}

            {/* Edit Profile */}
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <EditIcon/> Edit Profile
            </button>

            {/* Share */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                title="Share profile"
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

          {/* Username */}
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">@{username}</p>

          {/* Bio */}
          {bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              {bio}
            </p>
          )}

          {/* Website */}
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

          {/* Join date */}
          {joinDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Member since {joinDate}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { value: stats.followers,      label: "Followers" },
              { value: stats.following,      label: "Following" },
              { value: stats.movies_watched, label: "Movies Watched" },
              { value: stats.reviews,        label: "Reviews" },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {value.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">{label}</span>
              </div>
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>

          {/* Account info card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Account Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Email",    value: user?.email },
                { label: "Username", value: `@${username}` },
                { label: "Language", value: user?.language_preference || "—" },
                { label: "Theme",    value: user?.theme_preference    || "—" },
                { label: "Roles",    value: roles.length ? roles.join(", ") : "user" },
                { label: "Joined",   value: joinDate || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews placeholder */}
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center">
              <FilmIcon/>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">No recent activity yet.</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Start reviewing movies to see them here.</p>
            </div>
          ) : (
            reviews.slice(0, 3).map((item) => (
              <ReviewCard key={item.id} item={item} user={user} initials={initials}/>
            ))
          )}
        </div>
      )}

      {/* ══ REVIEWS ══ */}
      {tab === "Reviews" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Reviews</h2>
          {reviews.length === 0 ? (
            <EmptyState message="No reviews yet." sub="Rate and review movies to see them here."/>
          ) : (
            reviews.map((item) => (
              <ReviewCard key={item.id} item={item} user={user} initials={initials} compact/>
            ))
          )}
        </div>
      )}

      {/* ══ LISTS ══ */}
      {tab === "Lists" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Lists</h2>
          {lists.length === 0 ? (
            <EmptyState message="No lists yet." sub="Create lists to organise your movies."/>
          ) : (
            lists.map((list) => (
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
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  list.is_public
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}>
                  {list.is_public ? "Public" : "Private"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ STATS ══ */}
      {tab === "Stats" && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Statistics</h2>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Movies Watched", value: stats.movies_watched },
              { label: "Hours Watched",  value: stats.movies_watched * 2 }, // ~2h/film estimate
              { label: "Reviews",        value: stats.reviews },
              { label: "Lists",          value: lists.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Profile completeness */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Completeness</h3>
            {(() => {
              const checks = [
                { label: "Username set",  done: !!username },
                { label: "Bio added",     done: !!bio },
                { label: "Avatar uploaded", done: !!avatar },
                { label: "Website added", done: !!websiteUrl },
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
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                          {done
                            ? <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
    </div>
  );
}

/* ── Reusable ReviewCard ── */
function ReviewCard({ item, user, initials, compact = false }) {
  const avatar = user?.avatar_url || null;
  const username = user?.username || "";
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
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

      <div className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3">
        {item.poster && (
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            <img src={item.poster} alt={item.movie} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}/>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.movie}</p>
          {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
        </div>
      </div>

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

/* ── EmptyState ── */
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

