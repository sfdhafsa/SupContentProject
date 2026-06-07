import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { REPORT_REASON_LABELS } from "../../components/reports/ReportDialog.jsx";
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

const StarIcon = ({ filled = false }) => (
  <svg viewBox="0 0 20 20" className={`w-4 h-4 ${filled ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"}`}>
    <path d="M10 1.8l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6L5.1 17l.9-5.5-4-3.9 5.5-.8L10 1.8z" />
  </svg>
);

const userFilters = ["ALL", "ACTIVE", "BANNED"];
const reviewFilters = ["ALL", "FEATURED", "UNFEATURED"];
const reportFilters = ["ALL", "PENDING", "REVIEWED", "RESOLVED"];

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
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [reviewFilter, setReviewFilter] = useState("ALL");
  const [reportFilter, setReportFilter] = useState("PENDING");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        userFilter === "ALL" ||
        (userFilter === "BANNED" && user.is_banned) ||
        (userFilter === "ACTIVE" && !user.is_banned);

      const matchesQuery =
        activeTab !== "users" ||
        !normalizedQuery ||
        user.username?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, userFilter, users]);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesFilter =
        reviewFilter === "ALL" ||
        (reviewFilter === "FEATURED" && review.is_featured) ||
        (reviewFilter === "UNFEATURED" && !review.is_featured);

      const matchesQuery =
        activeTab !== "reviews" ||
        !normalizedQuery ||
        review.username?.toLowerCase().includes(normalizedQuery) ||
        review.movie_title?.toLowerCase().includes(normalizedQuery) ||
        review.text?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, reviewFilter, reviews]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesFilter =
        reportFilter === "ALL" ||
        report.status === reportFilter;

      const matchesQuery =
        activeTab !== "reports" ||
        !normalizedQuery ||
        report.reporter_username?.toLowerCase().includes(normalizedQuery) ||
        report.target_author_username?.toLowerCase().includes(normalizedQuery) ||
        report.target_text?.toLowerCase().includes(normalizedQuery) ||
        report.target_type?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, reportFilter, reports]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError("");

    try {
      const res = await api.get("/moderation/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    setError("");

    try {
      const res = await api.get("/moderation/reviews");
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    setError("");

    try {
      const res = await api.get("/moderation/reports");
      setReports(res.data.reports || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load reports.");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "reviews" && reviews.length === 0) {
      loadReviews();
    }
  }, [activeTab, reviews.length]);

  useEffect(() => {
    if (activeTab === "reports" && reports.length === 0) {
      loadReports();
    }
  }, [activeTab, reports.length]);

  const updateBan = async (targetUser, shouldBan) => {
    setBusyId(`user-${targetUser.id}`);
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

  const updateFeatured = async (review, shouldFeature) => {
    setBusyId(`review-${review.id}`);
    setError("");

    try {
      const res = await api.patch(`/moderation/reviews/${review.id}/${shouldFeature ? "feature" : "unfeature"}`);
      const updatedReview = res.data.review;

      setReviews((currentReviews) =>
        currentReviews.map((item) =>
          item.id === review.id
            ? {
                ...item,
                is_featured: updatedReview.is_featured,
                featured_by: updatedReview.featured_by,
                featured_at: updatedReview.featured_at,
                featured_by_username: shouldFeature ? currentUser?.username : null,
              }
            : item
        )
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update review feature status.");
    } finally {
      setBusyId("");
    }
  };

  const dismissReport = async (report) => {
    setBusyId(`report-${report.id}`);
    setError("");

    try {
      const res = await api.patch(`/moderation/reports/${report.id}/dismiss`);
      const updatedReport = res.data.report;
      setReports((currentReports) =>
        currentReports.map((item) => (item.id === report.id ? { ...item, ...updatedReport } : item))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to dismiss report.");
    } finally {
      setBusyId("");
    }
  };

  const deleteReportedTarget = async (report) => {
    setBusyId(`report-${report.id}`);
    setError("");

    try {
      const res = await api.delete(`/moderation/reports/${report.id}/target`);
      const updatedReport = res.data.report;
      setReports((currentReports) =>
        currentReports.map((item) => (item.id === report.id ? { ...item, ...updatedReport } : item))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete reported content.");
    } finally {
      setBusyId("");
    }
  };

  const isUsersTab = activeTab === "users";
  const isReviewsTab = activeTab === "reviews";
  const isReportsTab = activeTab === "reports";
  const isLoading = isUsersTab ? loadingUsers : isReviewsTab ? loadingReviews : loadingReports;
  const placeholder = isUsersTab ? "Search users..." : isReviewsTab ? "Search reviews..." : "Search reports...";
  const currentFilters = isUsersTab ? userFilters : isReviewsTab ? reviewFilters : reportFilters;
  const currentFilter = isUsersTab ? userFilter : isReviewsTab ? reviewFilter : reportFilter;
  const setCurrentFilter = isUsersTab ? setUserFilter : isReviewsTab ? setReviewFilter : setReportFilter;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-xl bg-[#D0021B]/10 text-[#D0021B] flex items-center justify-center">
              <ShieldIcon />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin view</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage users, bans, featured reviews, and ban history.
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
              placeholder={placeholder}
              className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {currentFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentFilter(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentFilter === item
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

      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-full sm:w-fit">
        {[
          { id: "users", label: "Users" },
          { id: "reviews", label: "Reviews" },
          { id: "reports", label: "Reports" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setQuery("");
              setError("");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {isUsersTab ? (
        <UsersPanel
          busyId={busyId}
          currentUser={currentUser}
          filteredUsers={filteredUsers}
          loading={isLoading}
          onUpdateBan={updateBan}
          users={users}
        />
      ) : isReviewsTab ? (
        <ReviewsPanel
          busyId={busyId}
          filteredReviews={filteredReviews}
          loading={isLoading}
          onUpdateFeatured={updateFeatured}
          reviews={reviews}
        />
      ) : (
        <ReportsPanel
          busyId={busyId}
          filteredReports={filteredReports}
          loading={isLoading}
          onDeleteTarget={deleteReportedTarget}
          onDismiss={dismissReport}
          reports={reports}
        />
      )}
    </div>
  );
}

function UsersPanel({ busyId, currentUser, filteredUsers, loading, onUpdateBan, users }) {
  return (
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
        <LoadingState />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={<UserIcon />} message="No users found." />
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
                      onClick={() => onUpdateBan(user, !user.is_banned)}
                      title={isCurrentUser ? "You cannot ban your own account" : undefined}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        user.is_banned
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-[#D0021B] hover:bg-[#b30218] text-white"
                      }`}
                    >
                      {busyId === `user-${user.id}` ? "Updating..." : user.is_banned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewsPanel({ busyId, filteredReviews, loading, onUpdateFeatured, reviews }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800">
        {[
          { label: "Total reviews", value: reviews.length },
          { label: "Featured", value: reviews.filter((item) => item.is_featured).length },
          { label: "Unfeatured", value: reviews.filter((item) => !item.is_featured).length },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : filteredReviews.length === 0 ? (
        <EmptyState icon={<StarIcon />} message="No reviews found." />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredReviews.map((review) => {
            const initials = review.username?.slice(0, 2).toUpperCase() || "U";
            const posterUrl = review.poster_url;

            return (
              <div key={review.id} className="p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3 min-w-0">
                  <Link
                    to={`/movies/${review.external_id}`}
                    className="w-14 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  >
                    {posterUrl ? (
                      <img src={posterUrl} alt={review.movie_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <StarIcon />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/movies/${review.external_id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#D0021B] transition-colors"
                      >
                        {review.movie_title || "Untitled movie"}
                      </Link>
                      {review.is_featured && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-[11px] font-semibold">
                          Featured
                        </span>
                      )}
                      {review.contains_spoiler && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-semibold">
                          Spoiler
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <Link to={`/profile/${review.user_id}`} className="flex items-center gap-1.5 hover:text-[#D0021B] transition-colors">
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-bold">
                          {review.avatar_url ? (
                            <img src={review.avatar_url} alt={review.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        {review.username}
                      </Link>
                      <span>{formatDate(review.created_at)}</span>
                      <span>{review.likes_count || 0} likes</span>
                    </div>

                    <div className="mt-2 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= Number(review.rating || 0)} />
                      ))}
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {review.text || "Rated this movie."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end lg:w-48">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 lg:text-right">
                    {review.is_featured
                      ? `Featured ${formatDate(review.featured_at)}${review.featured_by_username ? ` by ${review.featured_by_username}` : ""}`
                      : "Not featured"}
                  </p>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => onUpdateFeatured(review, !review.is_featured)}
                    className={`w-full lg:w-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      review.is_featured
                        ? "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                        : "bg-[#D0021B] hover:bg-[#b30218] text-white"
                    }`}
                  >
                    {busyId === `review-${review.id}` ? "Updating..." : review.is_featured ? "Unfeature" : "Feature"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportsPanel({ busyId, filteredReports, loading, onDeleteTarget, onDismiss, reports }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-4 border-b border-gray-100 dark:border-gray-800">
        {[
          { label: "Total reports", value: reports.length },
          { label: "Pending", value: reports.filter((item) => item.status === "PENDING").length },
          { label: "Reviewed", value: reports.filter((item) => item.status === "REVIEWED").length },
          { label: "Resolved", value: reports.filter((item) => item.status === "RESOLVED").length },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : filteredReports.length === 0 ? (
        <EmptyState icon={<ShieldIcon />} message="No reports found." />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredReports.map((report) => {
            const isPending = report.status === "PENDING";
            const targetText = report.target_text || "Reported content is unavailable or has no text.";

            return (
              <div key={report.id} className="p-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {report.target_type === "REVIEW" ? "Review" : "Comment"} report
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      report.status === "PENDING"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                        : report.status === "RESOLVED"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#D0021B]/10 text-[#D0021B] text-[11px] font-semibold">
                      {REPORT_REASON_LABELS[report.reason] || report.reason}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {targetText}
                  </p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Reporter</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {report.reporter_username || "Unknown user"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Target author</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {report.target_author_username || "Unknown user"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Reported at</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:mt-6 lg:flex-col lg:items-stretch">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 sm:mr-auto lg:mr-0 lg:h-6 lg:text-right">
                    {report.handled_at
                      ? `Handled ${formatDate(report.handled_at)}${report.handler_username ? ` by ${report.handler_username}` : ""}`
                      : "Not handled"}
                  </p>
                  <button
                    type="button"
                    disabled={Boolean(busyId) || !isPending}
                    onClick={() => onDismiss(report)}
                    className="w-full sm:w-auto lg:w-full px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busyId === `report-${report.id}` ? "Updating..." : "Dismiss"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyId) || !isPending}
                    onClick={() => onDeleteTarget(report)}
                    className="w-full sm:w-auto lg:w-full px-4 py-2 rounded-xl bg-[#D0021B] hover:bg-[#b30218] text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete content
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="p-12 text-center flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
