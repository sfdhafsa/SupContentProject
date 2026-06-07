import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { messagesApi } from "../../services/api/messages.api";
import { createMessagesSocket } from "../../services/socket/messages.socket";

const SendIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M2.8 9.5L17 3l-3.8 14-3.5-6L2.8 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.7 11L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5 text-gray-400">
    <path d="M5 16.5l-2 3V5.5A2.5 2.5 0 015.5 3h11A2.5 2.5 0 0119 5.5V14a2.5 2.5 0 01-2.5 2.5H5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SEARCH_HISTORY_KEY = "supcontent_conversation_user_search_history";

const readSearchHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeSearchHistory = (items) => {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, 6)));
};

const getMessageOtherUser = (message, currentUserId) =>
  String(message.sender_id) === String(currentUserId)
    ? {
        id: message.receiver_id,
        username: message.receiver_username,
        avatar_url: message.receiver_avatar_url,
      }
    : {
        id: message.sender_id,
        username: message.sender_username,
        avatar_url: message.sender_avatar_url,
      };

function Avatar({ user, size = "md" }) {
  const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className={`${dim} rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0`}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt={user.username || "User"} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{initials}</span>
      )}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="h-full min-h-56 flex flex-col items-center justify-center text-center p-6 sm:p-10">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <MessageIcon />
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-sm">{text}</p>
    </div>
  );
}

export default function Messages() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => readSearchHistory());
  const [content, setContent] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);
  const activeUserIdRef = useRef(null);
  const lastUrlUserIdRef = useRef(null);
  const userIdRef = useRef(user?.id);

  const activeUserId = activeUser?.id;
  const urlUserId = searchParams.get("user");

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  );

  const fetchConversations = useCallback(async () => {
    setError("");

    try {
      const res = await messagesApi.getConversations();
      setConversations(res.data.conversations || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchConversation = useCallback(async (otherUser) => {
    if (!otherUser?.id) return;

    setActiveUser(otherUser);
    setUserQuery(otherUser.username || "");
    setUserResults([]);
    setSearchOpen(false);
    setLoadingMessages(true);
    setError("");

    if (otherUser.username) {
      setSearchHistory((current) => {
        const nextHistory = [
          otherUser,
          ...current.filter((item) => String(item.id) !== String(otherUser.id)),
        ].slice(0, 6);
        writeSearchHistory(nextHistory);
        return nextHistory;
      });
    }

    try {
      const res = await messagesApi.getConversation(otherUser.id);
      const nextMessages = res.data.messages || [];
      setMessages(nextMessages);

      if (!otherUser.username && nextMessages.length > 0) {
        setActiveUser(getMessageOtherUser(nextMessages[0], user?.id));
      }

      await Promise.all(
        nextMessages
          .filter((message) => String(message.receiver_id) === String(user?.id) && !message.is_read)
          .map((message) => messagesApi.markAsRead(message.id).catch(() => null))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load this conversation.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const query = userQuery.trim();

    if (query.length < 2 || activeUser?.username === query) {
      setUserResults([]);
      setSearchingUsers(false);
      setSearchOpen(false);
      return undefined;
    }

    setSearchingUsers(true);
    setSearchOpen(true);
    const timer = window.setTimeout(() => {
      messagesApi.searchUsers(query)
        .then((res) => setUserResults(res.data.users || []))
        .catch(() => setUserResults([]))
        .finally(() => setSearchingUsers(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeUser?.username, userQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!urlUserId || loadingConversations || lastUrlUserIdRef.current === urlUserId) {
      return;
    }

    const conversation = conversations.find((item) =>
      String(item.other_user_id) === String(urlUserId)
    );

    lastUrlUserIdRef.current = urlUserId;
    fetchConversation(
      conversation
        ? {
            id: conversation.other_user_id,
            username: conversation.other_username,
            avatar_url: conversation.other_avatar_url,
          }
        : { id: urlUserId }
    );
  }, [conversations, fetchConversation, loadingConversations, urlUserId]);

  useEffect(() => {
    if (!token) return undefined;

    let mounted = true;
    let nextSocket;

    createMessagesSocket(token)
      .then((createdSocket) => {
        if (!mounted) {
          createdSocket.disconnect();
          return;
        }

        nextSocket = createdSocket;
        setSocket(createdSocket);

        createdSocket.on("connect", () => setSocketStatus("online"));
        createdSocket.on("disconnect", () => setSocketStatus("offline"));
        createdSocket.on("connect_error", (err) => {
          setSocketStatus("error");
          setError(err.message || "Unable to connect to messaging socket.");
        });
        createdSocket.on("message_error", (payload) => {
          setSending(false);
          setError(payload?.message || "Unable to send message.");
        });
        createdSocket.on("message_sent", (message) => {
          setSending(false);
          setMessages((current) => [...current, message]);
          fetchConversations();
        });
        createdSocket.on("receive_message", (message) => {
          const otherUser = getMessageOtherUser(message, userIdRef.current);

          if (String(otherUser.id) === String(activeUserIdRef.current)) {
            setMessages((current) => [...current, message]);
            messagesApi.markAsRead(message.id).catch(() => null);
          } else {
            setNotice(`New message from ${otherUser.username || "a user"}.`);
          }

          fetchConversations();
        });
      })
      .catch((err) => {
        setSocketStatus("error");
        setError(err.message || "Unable to start messaging socket.");
      });

    return () => {
      mounted = false;
      nextSocket?.disconnect();
    };
  }, [fetchConversations, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length, activeUserId]);

  const sendCurrentMessage = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!activeUserId || !trimmedContent || sending) return;

    setSending(true);
    setError("");
    setNotice("");

    if (socket?.connected) {
      socket.emit("send_message", {
        receiverId: activeUserId,
        content: trimmedContent,
      });
    } else {
      try {
        const res = await messagesApi.sendMessage(activeUserId, trimmedContent);
        setMessages((current) => [...current, res.data.message]);
        fetchConversations();
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to send message.");
      } finally {
        setSending(false);
      }
    }

    setContent("");
  };

  const clearSearchHistory = () => {
    writeSearchHistory([]);
    setSearchHistory([]);
  };

  const showSearchHistory =
    searchOpen &&
    !searchingUsers &&
    userQuery.trim().length === 0 &&
    searchHistory.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 dark:text-white tracking-normal">Conversations</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You can only message users that you follow mutually
          </p>
        </div>
        <span className={`w-fit px-3 py-1.5 rounded-full text-xs font-bold ${
          socketStatus === "online"
            ? "bg-green-50 dark:bg-green-900/20 text-green-600"
            : socketStatus === "error"
            ? "bg-red-50 dark:bg-red-900/20 text-red-600"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}>
          Socket {socketStatus}
        </span>
      </div>

      {(error || notice) && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm ${
          error
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
        }`}>
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 min-w-0">
        <aside className={`${activeUser ? "hidden lg:block" : "block"} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-visible lg:overflow-hidden min-w-0`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <input
                value={userQuery}
                onChange={(event) => {
                  setUserQuery(event.target.value);
                  setActiveUser(null);
                  setSearchOpen(true);
                }}
                onFocus={() => {
                  if (
                    (userQuery.trim().length >= 2 && activeUser?.username !== userQuery.trim()) ||
                    (userQuery.trim().length === 0 && searchHistory.length > 0)
                  ) {
                    setSearchOpen(true);
                  }
                }}
                placeholder="Search users by username"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
              />
              {showSearchHistory && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                  <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Recent searches</p>
                    <button
                      type="button"
                      onClick={clearSearchHistory}
                      className="text-xs font-bold text-[#D0021B] hover:text-[#b30218] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {searchHistory.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => fetchConversation(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar user={result} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{result.username}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Open conversation</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchOpen && !showSearchHistory && (searchingUsers || userResults.length > 0 || userQuery.trim().length >= 2) && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                  {searchingUsers ? (
                    <div className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500">Searching...</div>
                  ) : userResults.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500">No users found.</div>
                  ) : (
                    userResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => fetchConversation(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Avatar user={result} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{result.username}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Open conversation</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {loadingConversations ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState title="No conversations yet" text="Search for a mutual follower by username to start chatting." />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[60vh] overflow-y-auto lg:max-h-[560px]">
              {conversations.map((conversation) => {
                const otherUser = {
                  id: conversation.other_user_id,
                  username: conversation.other_username,
                  avatar_url: conversation.other_avatar_url,
                };
                const isActive = String(activeUserId) === String(otherUser.id);

                return (
                  <button
                    key={conversation.other_user_id}
                    type="button"
                    onClick={() => fetchConversation(otherUser)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                      isActive
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Avatar user={otherUser} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {otherUser.username || "Unknown user"}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#D0021B] text-[11px] leading-5 text-white font-bold text-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
                        {conversation.last_message_content}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className={`${activeUser ? "flex" : "hidden lg:flex"} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden min-h-[520px] max-h-[calc(100vh-190px)] flex-col min-w-0`}>
          {!activeUser ? (
            <EmptyState title="Select a conversation" text="Choose an existing conversation or search for a mutual follower by username." />
          ) : (
            <>
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveUser(null)}
                  className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Back to conversations"
                >
                  <BackIcon />
                </button>
                <Avatar user={activeUser} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {activeUser.username || "Conversation"}
                  </p>
                  <Link to={`/profile/${activeUser.id}`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#D0021B] transition-colors">
                    View profile
                  </Link>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-950/50">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <EmptyState title="No messages yet" text="Send the first message once the mutual follow rule is satisfied." />
                ) : (
                  <div className="space-y-3">
                    {sortedMessages.map((message) => {
                      const isMine = String(message.sender_id) === String(user?.id);

                      return (
                        <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[min(82%,34rem)] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-[#D0021B] text-white"
                              : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-line break-words">{message.content}</p>
                            <p className={`mt-1 text-[11px] ${isMine ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form onSubmit={sendCurrentMessage} className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 sm:gap-3">
                <input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 h-11 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
                />
                <button
                  type="submit"
                  disabled={!content.trim() || sending}
                  className="h-11 px-3 sm:px-4 rounded-full bg-[#D0021B] text-sm font-bold text-white hover:bg-[#b30218] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 flex-shrink-0"
                >
                  <SendIcon />
                  <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
