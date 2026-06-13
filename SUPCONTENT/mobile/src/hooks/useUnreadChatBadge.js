import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import useAuthSession from './useAuthSession';
import { useSocket } from './useSocket';
import { getConversations } from '../services/messagesApi';

const UnreadChatBadgeContext = createContext(null);

function countUnreadChats(conversations) {
  return conversations.filter((conversation) => Number(conversation.unread_count || 0) > 0).length;
}

function UnreadChatSocketSync({ onRefresh }) {
  useSocket({
    onReceiveMessage: onRefresh,
    onMessageSent: onRefresh,
  });

  return null;
}

export function UnreadChatBadgeProvider({ children }) {
  const { isAuthenticated, token } = useAuthSession();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChatCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadChatCount(0);
      return;
    }

    try {
      const conversations = await getConversations();
      setUnreadChatCount(countUnreadChats(conversations));
    } catch {
      // Keep the last known count when a background refresh fails.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadChatCount();
  }, [refreshUnreadChatCount, token]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshUnreadChatCount();
    });

    return () => subscription.remove();
  }, [isAuthenticated, refreshUnreadChatCount]);

  const value = useMemo(() => ({
    refreshUnreadChatCount,
    unreadChatCount,
  }), [refreshUnreadChatCount, unreadChatCount]);

  return (
    <UnreadChatBadgeContext.Provider value={value}>
      {isAuthenticated ? (
        <UnreadChatSocketSync onRefresh={refreshUnreadChatCount} />
      ) : null}
      {children}
    </UnreadChatBadgeContext.Provider>
  );
}

export default function useUnreadChatBadge() {
  const value = useContext(UnreadChatBadgeContext);

  if (!value) {
    throw new Error('useUnreadChatBadge must be used inside UnreadChatBadgeProvider.');
  }

  return value;
}
