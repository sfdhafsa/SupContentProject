import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api/axios.js";
import { createAppSocket } from "../../services/socket/app.socket.js";

const LIMIT = 30;
const REFRESH_INTERVAL_MS = 5000;

const HeartIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#D0021B]">
    <path d="M10 17s-7-4.5-7-9a4 4 0 017-2.65A4 4 0 0117 8c0 4.5-7 9-7 9z" />
  </svg>
);

const FollowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-emerald-500">
    <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 17c0-3 2.4-5 5-5 1.1 0 2.2.35 3.05.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 10v6M12 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-blue-500">
    <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-violet-500">
    <path d="M4.5 14.5l-2 3V5A2.5 2.5 0 015 2.5h10A2.5 2.5 0 0117.5 5v7A2.5 2.5 0 0115 14.5H4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M6.5 7h7M6.5 10h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MovieIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-amber-500">
    <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8h14M7 4v4M13 4v4M7 12v4M13 12v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <path d="M5 8a5 5 0 0110 0v3.4l1.4 2.1a.7.7 0 01-.58 1.1H4.18a.7.7 0 01-.58-1.1L5 11.4V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8.5 16a1.7 1.7 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const iconByType = {
  FOLLOW: <FollowIcon />,
  REVIEW_LIKE: <HeartIcon />,
  REVIEW_COMMENT: <CommentIcon />,
  COMMENT_REPLY: <CommentIcon />,
  MESSAGE: <MessageIcon />,
  MOVIE_RECOMMENDATION: <MovieIcon />,
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildMessage(notification) {
  const actorName = notification.username || "Someone";

  if (notification.message && notification.type !== "MOVIE_RECOMMENDATION") return notification.message;
  if (notification.type === "FOLLOW" && notification.viewer_follows_actor) return `${actorName} followed you back`;
  if (notification.type === "FOLLOW") return `${actorName} started following you`;
  if (notification.type === "REVIEW_LIKE") return `${actorName} liked your review`;
  if (notification.type === "REVIEW_COMMENT") return `${actorName} commented on your review`;
  if (notification.type === "COMMENT_REPLY") return `${actorName} replied to your comment`;
  if (notification.type === "MESSAGE") return `${actorName} sent you a message`;
  if (notification.type === "MOVIE_RECOMMENDATION") return "A new movie recommendation is ready for you";

  return "You have a new notification";
}

function MovieTitleLink({ notification, tmdbId, title, onOpen }) {
  if (!tmdbId || !title) return title || null;

  return (
    <Link
      to={`/movies/${tmdbId}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(notification);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className="font-bold text-[#D0021B] hover:text-[#b30218] hover:underline focus:outline-none focus:ring-2 focus:ring-[#D0021B]/30 rounded"
    >
      {title}
    </Link>
  );
}

function NotificationMessage({ notification, onMovieOpen }) {
  if (notification.type === "MOVIE_RECOMMENDATION") {
    const sourceTitle = notification.source_movie_title;
    const recommendedTitle = notification.movie_title;

    if (sourceTitle && recommendedTitle) {
      return (
        <>
          because you added{" "}
          <MovieTitleLink
            notification={notification}
            tmdbId={notification.source_movie_tmdb_id}
            title={sourceTitle}
            onOpen={onMovieOpen}
          />
          , you might enjoy{" "}
          <MovieTitleLink
            notification={notification}
            tmdbId={notification.movie_tmdb_id}
            title={recommendedTitle}
            onOpen={onMovieOpen}
          />
        </>
      );
    }

    if (recommendedTitle) {
      return (
        <>
          A new movie recommendation is ready for you:{" "}
          <MovieTitleLink
            notification={notification}
            tmdbId={notification.movie_tmdb_id}
            title={recommendedTitle}
            onOpen={onMovieOpen}
          />
        </>
      );
    }
  }

  return buildMessage(notification);
}

function buildNotificationTarget(notification) {
  const actorId = notification.actor_id || notification.actor_user_id;

  if (notification.type === "MESSAGE" && actorId) {
    return `/messages?user=${encodeURIComponent(actorId)}`;
  }

  if (notification.type === "FOLLOW" && actorId) {
    return `/profile/${actorId}`;
  }

  if (
    ["REVIEW_LIKE", "REVIEW_COMMENT", "COMMENT_REPLY"].includes(notification.type) &&
    notification.target_movie_tmdb_id &&
    notification.target_review_id
  ) {
    const params = new URLSearchParams({ review: String(notification.target_review_id) });
    if (notification.target_comment_id) {
      params.set("comment", String(notification.target_comment_id));
    }

    return `/movies/${notification.target_movie_tmdb_id}?${params.toString()}`;
  }

  if (notification.movie_tmdb_id) {
    return `/movies/${notification.movie_tmdb_id}`;
  }

  return null;
}

function NotificationAvatar({ notification }) {
  const initials = notification.username?.slice(0, 2).toUpperCase() || "?";
  const actorProfileId = notification.actor_id || notification.actor_user_id;
  const content = (
    <>
      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        {notification.avatar_url ? (
          <img
            src={notification.avatar_url}
            alt={notification.username || "User"}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{initials}</span>
        )}
      </div>
      <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-900 flex items-center justify-center">
        {iconByType[notification.type] || <BellIcon />}
      </div>
    </>
  );

  if (actorProfileId) {
    return (
      <Link
        to={`/profile/${actorProfileId}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="relative flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D0021B]/30"
        aria-label={`Open ${notification.username || "user"} profile`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      {content}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-22 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1">
              <div className="h-4 w-72 max-w-full bg-gray-100 dark:bg-gray-800 rounded-lg" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg mt-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNotifications({ unreadOnly }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-16 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <BellIcon />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {unreadOnly ? "No unread notifications" : "No notifications yet"}
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
        {unreadOnly ? "Everything is caught up." : "Likes, comments, follows, messages, and recommendations will appear here."}
      </p>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [followingId, setFollowingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setError("");

    try {
      const res = await api.get("/social/notifications", {
        params: { limit: LIMIT, offset: 0 },
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load notifications. Please try again.");
      console.error("Notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", fetchNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", fetchNotifications);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!token) return undefined;

    let mounted = true;
    let nextSocket;

    createAppSocket(token)
      .then((createdSocket) => {
        if (!mounted) {
          createdSocket.disconnect();
          return;
        }

        nextSocket = createdSocket;
        createdSocket.on("notifications_changed", fetchNotifications);
      })
      .catch(() => null);

    return () => {
      mounted = false;
      nextSocket?.disconnect();
    };
  }, [fetchNotifications, token]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const visibleNotifications = useMemo(
    () => filter === "unread"
      ? notifications.filter((item) => !item.is_read)
      : notifications,
    [filter, notifications]
  );

  const handleMarkAsRead = async (notification) => {
    if (notification.is_read || markingId) return;
    setMarkingId(notification.id);

    try {
      await api.patch(`/social/notifications/${notification.id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      console.error("Mark notification as read error:", err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleNotificationClick = async (notification) => {
    await handleMarkAsRead(notification);

    const target = buildNotificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  const handleFollowBack = async (notification) => {
    const actorId = notification.actor_id || notification.actor_user_id;
    if (!actorId || followingId) return;

    setFollowingId(notification.id);

    try {
      await handleMarkAsRead(notification);
      const statusRes = await api.get(`/social/follow/${actorId}/follow-status`);

      if (statusRes.data?.isFollowing) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true, viewer_follows_actor: true }
              : item
          )
        );
        return;
      }

      const res = await api.post(`/social/follow/${actorId}`);

      if (res.data?.status === "followed") {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true, viewer_follows_actor: true }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Follow back error:", err);
    } finally {
      setFollowingId(null);
    }
  };

  const handleMessageUser = async (notification) => {
    const actorId = notification.actor_id || notification.actor_user_id;
    if (!actorId) return;

    await handleMarkAsRead(notification);
    navigate(`/messages?user=${encodeURIComponent(actorId)}`);
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    try {
      await api.patch("/social/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    } catch (err) {
      console.error("Mark all notifications as read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-950 dark:text-white tracking-normal">
            Notifications
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-3">
            Stay updated with your movie community
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className={`px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-gray-100 transition-all ${
            unreadCount === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {markingAll ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      <div className="inline-flex items-center gap-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1 shadow-sm mb-10">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
            filter === "all"
              ? "bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          All <span className="ml-2 text-xs">({notifications.length})</span>
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
            filter === "unread"
              ? "bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Unread <span className="ml-2 text-xs">({unreadCount})</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          {error}
          <button onClick={fetchNotifications} className="font-semibold hover:underline ml-2">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <NotificationSkeleton />
      ) : visibleNotifications.length === 0 ? (
        <EmptyNotifications unreadOnly={filter === "unread"} />
      ) : (
        <div className="flex flex-col gap-3">
          {visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNotificationClick(notification);
                }
              }}
              role="button"
              tabIndex={0}
              aria-disabled={markingId === notification.id}
              className={`relative w-full text-left rounded-2xl border p-5 transition-all ${
                notification.is_read
                  ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
              }`}
            >
              <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center">
                <NotificationAvatar notification={notification} />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-gray-950 dark:text-white">
                    <NotificationMessage
                      notification={notification}
                      onMovieOpen={handleNotificationClick}
                    />
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {notification.type === "FOLLOW" && (notification.actor_id || notification.actor_user_id) && (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {notification.viewer_follows_actor ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageUser(notification);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#D0021B] text-white text-sm font-bold hover:bg-[#b30218] transition-colors"
                      >
                        Message
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={followingId === notification.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowBack(notification);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          followingId === notification.id
                            ? "bg-[#D0021B]/50 text-white cursor-not-allowed"
                            : "bg-[#D0021B] text-white hover:bg-[#b30218]"
                        }`}
                      >
                        {followingId === notification.id ? "Following..." : "Follow back"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!notification.is_read && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#D0021B]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
