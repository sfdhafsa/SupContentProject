import { useCallback, useEffect, useState } from 'react';
import { getConversation, markMessageAsRead, sendMessage } from '../services/messagesApi';

export function useConversation(userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getConversation(userId);
      setMessages(data);
      setError(null);

      // Mark unread messages as read
      const unread = data.filter((m) => !m.is_read && m.sender_id !== userId);
      unread.forEach((m) => markMessageAsRead(m.id).catch(() => {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [userId]);

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
  }, []);

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