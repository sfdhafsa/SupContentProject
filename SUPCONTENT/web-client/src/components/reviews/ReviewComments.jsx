import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api/axios";

function Avatar({ user, dark }) {
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";
  const fallbackClass = dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300";

  return (
    <Link to={`/profile/${user.user_id}`} className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10 hover:ring-[#D0021B] transition-all">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${fallbackClass}`}>{initials}</div>
      )}
    </Link>
  );
}

function buildCommentTree(comments) {
  const map = new Map();
  const roots = [];

  comments.forEach((comment) => {
    map.set(String(comment.id), { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parent_comment_id && map.has(String(comment.parent_comment_id))) {
      map.get(String(comment.parent_comment_id)).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

const FlagIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-3.5 h-3.5">
    <path d="M6 18V4.5M6 5h9.5l-1.4 3 1.4 3H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function CommentItem({ comment, currentUserId, dark, depth, isAuthenticated, onReply, onReport, targetCommentId }) {
  const bubbleClass = dark
    ? "bg-gray-900/80 border-white/10 text-gray-300"
    : "bg-gray-50 dark:bg-gray-800/70 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300";
  const nameClass = dark ? "text-white" : "text-gray-900 dark:text-white";
  const connectorClass = dark ? "border-white/10" : "border-gray-200 dark:border-gray-700";
  const isMine = String(comment.user_id) === String(currentUserId);
  const isTarget = String(comment.id) === String(targetCommentId);

  return (
    <div id={`comment-${comment.id}`} className={depth > 0 ? "relative ml-7 sm:ml-10 scroll-mt-24" : "scroll-mt-24"}>
      {depth > 0 && <div className={`absolute -left-4 top-0 h-full border-l ${connectorClass}`} />}
      <div className="flex gap-3">
        <Avatar user={comment} dark={dark} />
        <div className="min-w-0 flex-1">
          <div className={`rounded-2xl border px-3.5 py-2.5 transition-colors ${isTarget ? "border-[#D0021B] bg-[#D0021B]/15 text-white" : bubbleClass}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <Link to={`/profile/${comment.user_id}`} className={`text-xs font-bold hover:text-[#D0021B] transition-colors ${nameClass}`}>
                {comment.username}
              </Link>
              {depth > 0 && <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">reply</span>}
            </div>
            <p className="text-sm leading-6 whitespace-pre-line break-words">{comment.text}</p>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="text-xs font-bold text-gray-400 hover:text-[#D0021B] transition-colors"
            >
              Reply
            </button>
            {isAuthenticated && !isMine && (
              <button
                type="button"
                onClick={() => onReport?.({ type: "COMMENT", id: comment.id })}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors"
              >
                <FlagIcon />
                Report
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              dark={dark}
              depth={depth + 1}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
              onReport={onReport}
              targetCommentId={targetCommentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewComments({
  reviewId,
  initialCount = 0,
  variant = "light",
  open: controlledOpen,
  onCountChange,
  onReport,
  targetCommentId,
}) {
  const dark = variant === "dark";
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const inputRef = useRef(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const loadComments = useCallback(async () => {
    if (!reviewId) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reviews/${reviewId}/comments`);
      const nextComments = res.data || [];
      setComments(nextComments);
      setCommentsCount(nextComments.length);
      onCountChange?.(nextComments.length);
    } catch (err) {
      console.error("Comments error:", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (open) loadComments();
  }, [open, loadComments]);

  useEffect(() => {
    if (!open || loading || !targetCommentId || comments.length === 0) return;

    window.setTimeout(() => {
      document
        .getElementById(`comment-${targetCommentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [comments, loading, open, targetCommentId]);

  const handleReply = (comment) => {
    setReplyTo(comment);
    if (!isControlled) setInternalOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || submitting) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post(`/reviews/${reviewId}/comments`, {
        text: text.trim(),
        parent_comment_id: replyTo?.id || null,
      });
      setText("");
      setReplyTo(null);
      await loadComments();
    } catch (err) {
      console.error("Comment submit error:", err);
      setError(err?.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = dark
    ? "border-white/10 bg-gray-950/80 text-white placeholder:text-gray-600 focus:border-[#D0021B] focus:ring-red-900/20"
    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#D0021B] focus:ring-red-50 dark:focus:ring-red-900/20";
  const commentRowClass = dark ? "border-white/10" : "border-gray-100 dark:border-gray-800";

  return (
    <div className="mt-3">
      {!isControlled && (
        <button
          type="button"
          onClick={() => setInternalOpen((value) => !value)}
          className={dark ? "inline-flex items-center rounded-xl px-2.5 py-1.5 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-colors" : "inline-flex items-center rounded-xl px-2.5 py-1.5 text-sm font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"}
        >
          {open ? "Hide comments" : commentsCount > 0 ? `Comments (${commentsCount})` : "Comment"}
        </button>
      )}

      {open && (
        <div className="space-y-3">
          {commentsCount > 0 && (
            <p className={dark ? "text-xs font-semibold text-gray-400" : "text-xs font-semibold text-gray-500 dark:text-gray-400"}>
              {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((item) => (
                <div key={item} className="flex gap-3 animate-pulse">
                  <div className={`w-8 h-8 rounded-full ${dark ? "bg-white/10" : "bg-gray-100 dark:bg-gray-800"}`} />
                  <div className={`h-14 flex-1 rounded-2xl ${dark ? "bg-white/10" : "bg-gray-100 dark:bg-gray-800"}`} />
                </div>
              ))}
            </div>
          ) : tree.length === 0 ? (
            <p className={dark ? "text-sm text-gray-500" : "text-sm text-gray-400 dark:text-gray-500"}>No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {tree.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  dark={dark}
                  depth={0}
                  isAuthenticated={isAuthenticated}
                  onReply={handleReply}
                  onReport={onReport}
                  targetCommentId={targetCommentId}
                />
              ))}
            </div>
          )}

          {replyTo && (
            <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs ${dark ? "border-white/10 bg-gray-950/80 text-gray-400" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
              <span>Replying to <span className="font-bold">{replyTo.username}</span></span>
              <button type="button" onClick={() => setReplyTo(null)} className="font-bold text-[#D0021B] hover:text-[#b30218] transition-colors">
                Cancel
              </button>
            </div>
          )}

          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className={`flex items-center gap-3 border-t ${commentRowClass} pt-3`}>
              <div className={dark ? "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400" : "w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"}>
                <span className="text-lg leading-none">☺</span>
              </div>
              <input
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
                className={`h-10 flex-1 rounded-full border px-4 text-sm outline-none focus:ring-2 ${inputClass}`}
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="h-10 px-2 text-sm font-bold text-[#D0021B] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Send comment"
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-[#D0021B] border-t-transparent animate-spin" />
                ) : (
                  "Post"
                )}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl bg-[#D0021B] text-xs font-bold text-white hover:bg-[#b30218] transition-colors"
            >
              Sign in to comment
            </button>
          )}

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
