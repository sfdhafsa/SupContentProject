import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api/axios";
import { listsApi } from "../services/api/lists.api";
import { messagesApi } from "../services/api/messages.api";
import { moviesApi } from "../services/api/movies.api";
import { createAppSocket } from "../services/socket/app.socket";

/* ── Icons ── */
const FilmIcon = () => (
  <svg viewBox="0 0 26 26" fill="none" className="w-5 h-5">
    <rect x="2" y="5" width="22" height="16" rx="2" stroke="white" strokeWidth="2" />
    <path d="M2 9h22M2 17h22M7 5v4M7 17v4M13 5v4M13 17v4M19 5v4M19 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400 flex-shrink-0">
    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const HelpIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 8.5a2.5 2.5 0 114.5 1.5c-.5.5-2 1-2 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="11" cy="15.5" r="0.75" fill="currentColor" />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M19 12.5A8 8 0 119.5 3a6 6 0 009.5 9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SunIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-4 h-4">
    <path d="M15 8l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 11H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 4H5a1 1 0 00-1 1v12a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M6 8.5a5 5 0 0110 0v3.4l1.5 2.4a.7.7 0 01-.6 1.05H5.1a.7.7 0 01-.6-1.05L6 11.9V8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 17a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const MessageIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M5 16.5l-2 3V5.5A2.5 2.5 0 015.5 3h11A2.5 2.5 0 0119 5.5V14a2.5 2.5 0 01-2.5 2.5H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 8h8M7 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" className={`w-3 h-3 ${filled ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor">
    <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77l-4.94 2.39.94-5.5-4-3.9 5.61-.92z" />
  </svg>
);

const NAV_LINKS_PUBLIC = [
  { label: "Discover", to: "/discover" },
  { label: "Lists",  to: "/lists" },
];
const NAV_LINKS_AUTH = [
  { label: "Home",     to: "/home" },
  { label: "Discover", to: "/discover" },
  { label: "Library",  to: "/library" },
  { label: "Lists",    to: "/lists" },
];

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? "text-gray-900 dark:text-white font-semibold"
      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
  }`;

function UserDropdown({ user, onLogout }) {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg py-1.5 z-50">
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
      </div>
      <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
          <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        My profile
      </Link>
      <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Settings
      </Link>
      <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
      <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <LogoutIcon />
        Sign out
      </button>
    </div>
  );
}

// ── Search Dropdown ──
function SearchAvatar({ user }) {
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt={user.username || "User"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
          {initials}
        </div>
      )}
    </div>
  );
}

function SearchDropdown({ movies, users, lists, loading, query, onSelectMovie, onSelectUser, onSelectList, onSeeAll }) {
  if (!query.trim()) return null;

  const hasMovies = movies.length > 0;
  const hasUsers = users.length > 0;
  const hasLists = lists.length > 0;

  return (
    <div className="absolute top-[calc(100%+8px)] left-1/2 right-auto w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden sm:left-0 sm:right-0 sm:w-auto sm:max-w-none sm:translate-x-0">
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !hasMovies && !hasUsers && !hasLists && (
        <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          Aucun resultat trouve pour "{query}"
        </div>
      )}

      {!loading && (hasMovies || hasUsers || hasLists) && (
        <>
          <div className="max-h-80 overflow-y-auto">
            {hasMovies && movies.map((movie) => (
              <button
                key={`movie-${movie.tmdb_id}`}
                onClick={() => onSelectMovie(movie.tmdb_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                {/* Poster mini */}
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
                        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {movie.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {movie.release_date ? movie.release_date.slice(0, 4) : "-"}
                    </span>
                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <StarIcon filled />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
            {hasUsers && (
              <div className={`${hasMovies ? "border-t border-gray-100 dark:border-gray-700" : ""}`}>
                <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Users
                </p>
                {users.map((searchUser) => (
                  <button
                    key={`user-${searchUser.id}`}
                    onClick={() => onSelectUser(searchUser.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <SearchAvatar user={searchUser} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {searchUser.username}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        @{searchUser.username}
                      </p>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0">
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            {hasLists && (
              <div className={`${hasMovies || hasUsers ? "border-t border-gray-100 dark:border-gray-700" : ""}`}>
                <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Lists from people you follow
                </p>
                {lists.map((list) => (
                  <button
                    key={`list-${list.id}`}
                    onClick={() => onSelectList(list.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#D0021B]">
                        <path d="M5 4h10a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 16H5a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 015 4z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {list.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        by {list.owner_username} · {list.movie_count ?? 0} films
                      </p>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0">
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* See all */}
          <button
            onClick={onSeeAll}
            className="w-full px-4 py-3 text-sm font-semibold text-[#D0021B] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
          >
            Voir tous les résultats pour "{query}" →
          </button>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, token, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch]           = useState("");
  const [dropdownOpen, setDropdown]   = useState(false);
  const [mobileOpen, setMobile]       = useState(false);
  const [movieResults, setMovieResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [listResults, setListResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const searchRef                     = useRef(null);

  const navLinks = isAuthenticated ? NAV_LINKS_AUTH : NAV_LINKS_PUBLIC;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setMovieResults([]);
      setUserResults([]);
      setListResults([]);
      setSearchOpen(false);
      return;
    }

    setSearchOpen(true);
    setSearchLoading(true);

    const timer = setTimeout(() => {
      const requests = [moviesApi.search(search, 1)];

      if (isAuthenticated && search.trim().length >= 2) {
        requests.push(messagesApi.searchUsers(search));
        requests.push(listsApi.searchFollowing(search));
      }

      Promise.allSettled(requests)
        .then(([moviesRes, usersRes, listsRes]) => {
          setMovieResults(
            moviesRes.status === "fulfilled"
              ? (moviesRes.value.data.data.results || []).slice(0, 6)
              : []
          );
          setUserResults(
            usersRes?.status === "fulfilled"
              ? (usersRes.value.data.users || []).slice(0, 6)
              : []
          );
          setListResults(
            listsRes?.status === "fulfilled"
              ? (listsRes.value.data.lists || []).slice(0, 6)
              : []
          );
        })
        .catch(() => {
          setMovieResults([]);
          setUserResults([]);
          setListResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated, search]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }

    const fetchUnreadNotifications = () => {
      api.get("/social/notifications/unread-count")
        .then((res) => setUnreadNotifications(res.data.count || 0))
        .catch(() => setUnreadNotifications(0));
    };

    fetchUnreadNotifications();

    const intervalId = window.setInterval(fetchUnreadNotifications, 5000);
    window.addEventListener("focus", fetchUnreadNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", fetchUnreadNotifications);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    let mounted = true;
    let nextSocket;

    createAppSocket(token)
      .then((createdSocket) => {
        if (!mounted) {
          createdSocket.disconnect();
          return;
        }

        nextSocket = createdSocket;
        createdSocket.on("notifications_changed", (payload = {}) => {
          if (Number.isFinite(payload.unreadCount)) {
            setUnreadNotifications(payload.unreadCount);
            return;
          }

          api.get("/social/notifications/unread-count")
            .then((res) => setUnreadNotifications(res.data.count || 0))
            .catch(() => null);
        });
      })
      .catch(() => null);

    return () => {
      mounted = false;
      nextSocket?.disconnect();
    };
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    setDropdown(false);
    setMobile(false);
    navigate("/login");
  };

  const handleSelectMovie = (tmdbId) => {
    setSearch("");
    setSearchOpen(false);
    navigate(`/movies/${tmdbId}`);
  };

  const handleSelectUser = (userId) => {
    setSearch("");
    setSearchOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handleSelectList = (listId) => {
    setSearch("");
    setSearchOpen(false);
    navigate(`/lists/${listId}`);
  };

  const handleSeeAll = () => {
    setSearchOpen(false);
    navigate(`/discover?q=${encodeURIComponent(search)}`);
    setSearch("");
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 flex items-center h-16 gap-2 sm:gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 sm:mr-2">
          <div className="w-9 h-9 bg-[#D0021B] rounded-lg flex items-center justify-center flex-shrink-0">
            <FilmIcon />
          </div>
          <span className="font-bold text-sm tracking-widest text-gray-900 dark:text-white hidden sm:block">
            SUPMOVIES
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Search avec dropdown */}
        <div className="flex-1 min-w-0 mx-1 md:mx-4 relative" ref={searchRef}>
          <div className="relative flex items-center">
            <span className="absolute left-3"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search movies, users, lists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setSearchOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && search.trim() && handleSeeAll()}
              className="w-full min-w-0 pl-9 pr-9 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20 transition-all sm:pr-4"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchOpen(false); }}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Dropdown résultats */}
          {searchOpen && (
            <SearchDropdown
              movies={movieResults}
              users={userResults}
              lists={listResults}
              loading={searchLoading}
              query={search}
              onSelectMovie={handleSelectMovie}
              onSelectUser={handleSelectUser}
              onSelectList={handleSelectList}
              onSeeAll={handleSeeAll}
            />
          )}
        </div>

        {/* Right icons — desktop */}
        <div className="hidden md:flex items-center gap-1">

          {/* Help */}
          <Link
            to="/help"
            title="Help"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-all"
          >
            <HelpIcon />
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={darkMode ? "Light mode" : "Dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-all"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* ── CONNECTED ── */}
          {isAuthenticated ? (
            <>
              <Link
                to="/messages"
                title="Conversations"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-all"
              >
                <MessageIcon />
              </Link>

              <Link
                to="/notifications"
                title="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-all"
              >
                <BellIcon />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1.5 top-1.5 min-w-4 h-4 px-1 rounded-full bg-[#D0021B] text-[10px] leading-4 text-white font-bold text-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
              >
                <LogoutIcon />
              </button>

              {/* Avatar + dropdown */}
              <div className="relative ml-1">
                <button
                  onClick={() => setDropdown((o) => !o)}
                  className="w-9 h-9 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#D0021B] transition-all focus:outline-none"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                      {initials}
                    </div>
                  )}
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdown(false)} />
                    <div className="relative z-50">
                      <UserDropdown user={user} onLogout={handleLogout} />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── NOT CONNECTED ── */
            <Link
              to="/login"
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-[#D0021B] hover:bg-[#b30218] text-white text-sm font-semibold rounded-xl transition-all"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Hello, Sign in
            </Link>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0"
          onClick={() => setMobile((o) => !o)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 dark:bg-red-900/20 text-[#D0021B]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

          <Link
            to="/help"
            onClick={() => setMobile(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <HelpIcon />
            Help
          </Link>

          {/* Dark mode toggle mobile */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/messages"
                onClick={() => setMobile(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <MessageIcon />
                Conversations
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobile(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="relative">
                  <BellIcon />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-[#D0021B]" />
                  )}
                </span>
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-auto text-xs font-bold text-[#D0021B]">{unreadNotifications}</span>
                )}
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobile(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                My profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogoutIcon />
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobile(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#D0021B] text-white hover:bg-[#b30218] transition-colors"
            >
              Hello, Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
