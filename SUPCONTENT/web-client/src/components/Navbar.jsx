import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
const BellIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
    <path d="M11 2a7 7 0 00-7 7v3l-1.5 2.5h17L18 12V9a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-4 h-4">
    <path d="M15 8l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 11H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 4H5a1 1 0 00-1 1v12a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Discover", to: "/discover" },
  { label: "Library", to: "/library" },
  { label: "Lists", to: "/lists" },
];

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
  }`;

function UserDropdown({ user, onLogout }) {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-50">
      <div className="px-4 py-2 border-b border-gray-100 mb-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>
      <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
          <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        My profile
      </Link>
      <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Settings
      </Link>
      <div className="h-px bg-gray-100 my-1" />
      <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
        <LogoutIcon />
        Sign out
      </button>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <div className="w-9 h-9 bg-[#D0021B] rounded-lg flex items-center justify-center">
            <FilmIcon />
          </div>
          <span className="font-bold text-sm tracking-widest text-gray-900 hidden sm:block">
            SUPMOVIES
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 mx-2 md:mx-4">
          <div className="relative flex items-center">
            <span className="absolute left-3"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 transition-all"
            />
          </div>
        </div>

        {/* Right icons — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <HelpIcon />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <MoonIcon />
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D0021B] rounded-full border-2 border-white" />
          </button>

          {/* Logout icon */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogoutIcon />
          </button>

          {/* Avatar + dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-9 h-9 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#D0021B] transition-all focus:outline-none"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {initials}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="relative z-50">
                  <UserDropdown user={user} onLogout={handleLogout} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-all ml-auto"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-red-50 text-[#D0021B]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="h-px bg-gray-100 my-2" />
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
