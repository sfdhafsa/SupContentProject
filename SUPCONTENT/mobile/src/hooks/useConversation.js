import { useCallback, useEffect, useState } from 'react';
import { getConversation, markMessageAsRead, sendMessage } from '../services/messagesApi';
import useUnreadChatBadge from './useUnreadChatBadge';

export function useConversation(userId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { refreshUnreadChatCount } = useUnreadChatBadge();

  const markReceivedMessagesAsRead = useCallback(async (items) => {
    if (!currentUserId) return;

    const unread = items.filter((message) =>
      !message.is_read &&
      String(message.receiver_id) === String(currentUserId)
    );

    if (unread.length === 0) return;

    await Promise.all(unread.map((message) => markMessageAsRead(message.id).catch(() => null)));
    refreshUnreadChatCount();
  }, [currentUserId, refreshUnreadChatCount]);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getConversation(userId);
      setMessages(data);
      setError(null);
      await markReceivedMessagesAsRead(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [markReceivedMessagesAsRead, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = useCallback(
    async (content) => {
      if (!content?.trim() || !userId) return;
      try {
        setSending(true);
        const message = await sendMessage(userId, content.trim());
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    },
    [userId]
  );

  // Called by socket hook when a new message arrives in real-time
  const appendMessage = useCallback((message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      return exists ? prev : [...prev, message];
    });
    markReceivedMessagesAsRead([message]);
  }, [markReceivedMessagesAsRead]);

  return {
    messages,
    loading,
    sending,
    error,
    send,
    appendMessage,
    refresh: load,
  };
}
