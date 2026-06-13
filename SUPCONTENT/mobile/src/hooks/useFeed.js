import { useCallback, useEffect, useState } from 'react';
import { getFeed } from '../services/feedApi';

const LIMIT = 20;

export function useFeed(order = 'desc') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const currentOffset = reset ? 0 : offset;

        const data = await getFeed({
          limit: LIMIT,
          offset: currentOffset,
          order,
        });

        const newItems = data.items || [];

        if (reset) {
          setItems(newItems);
          setOffset(LIMIT);
        } else {
          setItems(prev => [...prev, ...newItems]);
          setOffset(prev => prev + LIMIT);
        }

        setHasMore(newItems.length === LIMIT);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [offset, order]
  );

  useEffect(() => {
    loadFeed(true);
  }, [order]);

  return {
    items,
    loading,
    refreshing,
    error,
    hasMore,
    loadMore: () => hasMore && !loading && loadFeed(),
    refresh: () => loadFeed(true),
  };
}
