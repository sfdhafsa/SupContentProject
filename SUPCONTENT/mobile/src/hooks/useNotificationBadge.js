import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useAuthSession from './useAuthSession';
import { useSocket } from './useSocket';
import { getUnreadNotificationCount } from '../services/notificationsApi';

const NotificationBadgeContext = createContext(null);

function NotificationSocketSync({ onCountChanged }) {
  useSocket({
    onNotificationsChanged: (payload) => {
      const nextCount = Number(payload?.unreadCount);
      if (Number.isFinite(nextCount)) onCountChanged(nextCount);
    },
  });

  return null;
}

export function NotificationBadgeProvider({ children }) {
  const { isAuthenticated, token } = useAuthSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(Math.max(0, Number(count) || 0));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      updateUnreadCount(await getUnreadNotificationCount());
    } catch {
      // Keep the last known count when a background refresh fails.
    }
  }, [isAuthenticated, updateUnreadCount]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, token]);

  const value = useMemo(() => ({
    unreadCount,
    refreshUnreadCount,
    updateUnreadCount,
  }), [refreshUnreadCount, unreadCount, updateUnreadCount]);

  return (
    <NotificationBadgeContext.Provider value={value}>
      {isAuthenticated ? (
        <NotificationSocketSync onCountChanged={updateUnreadCount} />
      ) : null}
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export default function useNotificationBadge() {
  const value = useContext(NotificationBadgeContext);

  if (!value) {
    throw new Error('useNotificationBadge must be used inside NotificationBadgeProvider.');
  }

  return value;
}
