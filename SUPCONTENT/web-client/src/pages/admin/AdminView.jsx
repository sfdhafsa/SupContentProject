import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api/axios.js";

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-400">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-gray-400">
    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M10 2l6 2.4v4.8c0 3.7-2.4 6.8-6 8.8-3.6-2-6-5.1-6-8.8V4.4L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7.5 10.2l1.6 1.6 3.6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const filters = ["ALL", "ACTIVE", "BANNED"];

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export default function AdminView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "BANNED" && user.is_banned) ||
        (filter === "ACTIVE" && !user.is_banned);

      const matchesQuery =
        !normalizedQuery ||
        user.username?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, users]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/moderation/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateBan = async (targetUser, shouldBan) => {
    setBusyId(targetUser.id);
    setError("");

    try {
      const res = await api.patch(`/moderation/users/${targetUser.id}/${shouldBan ? "ban" : "unban"}`);
      const updatedUser = res.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === targetUser.id ? updatedUser : item))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update user status.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-xl bg-[#D0021B]/10 text-[#D0021B] flex items-center justify-center">
              <ShieldIcon />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin view</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage users, bans, and ban history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === item
                    ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800">
          {[
            { label: "Total users", value: users.length },
            { label: "Active", value: users.filter((item) => !item.is_banned).length },
            { label: "Banned", value: users.filter((item) => item.is_banned).length },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="min-h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserIcon />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((user) => {
              const isAdmin = (user.roles || []).map((role) => String(role).toLowerCase()).includes("admin");
              const isCurrentUser = user.id === currentUser?.id;
              const initials = user.username?.slice(0, 2).toUpperCase() || "U";

              return (
                <div key={user.id} className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/profile/${user.id}`}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#D0021B] transition-colors"
                        >
                          {user.username}
                        </Link>
                        {isAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-[#D0021B]/10 text-[#D0021B] text-[11px] font-semibold">
                            Admin
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          user.is_banned
                            ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                            : "bg-green-50 dark:bg-green-900/20 text-green-600"
                        }`}>
                          {user.is_banned ? "Banned" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 lg:w-[680px]">
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Joined</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Banned by</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {user.is_banned ? user.banned_by_username || "Unknown admin" : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Banned at</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.is_banned ? formatDate(user.banned_at) : "-"}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <button
                        type="button"
                        disabled={Boolean(busyId) || isCurrentUser}
                        onClick={() => updateBan(user, !user.is_banned)}
                        title={isCurrentUser ? "You cannot ban your own account" : undefined}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.is_banned
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-[#D0021B] hover:bg-[#b30218] text-white"
                        }`}
                      >
                        {busyId === user.id ? "Updating..." : user.is_banned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
