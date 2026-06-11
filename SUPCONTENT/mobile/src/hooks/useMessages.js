import { useCallback, useEffect, useState } from 'react';
import { getConversations } from '../services/messagesApi';

export function useMessages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getConversations();
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, []);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}