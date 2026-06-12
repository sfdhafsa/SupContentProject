import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAuthToken,
  getAuthUser,
  subscribeToAuthSession,
} from '../services/authStorage';

const AuthSessionContext = createContext(null);

export function AuthSessionProvider({ children }) {
  const [session, setSession] = useState({
    loading: true,
    token: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;
    let sessionVersion = 0;

    const unsubscribe = subscribeToAuthSession(({ token, user }) => {
      sessionVersion += 1;
      setSession({
        loading: false,
        token,
        user,
      });
    });

    async function loadSession() {
      const loadVersion = sessionVersion;

      try {
        const [token, user] = await Promise.all([getAuthToken(), getAuthUser()]);

        if (!mounted || loadVersion !== sessionVersion) return;
        setSession({
          loading: false,
          token,
          user,
        });
      } catch {
        if (!mounted || loadVersion !== sessionVersion) return;
        setSession({
          loading: false,
          token: null,
          user: null,
        });
      }
    }

    loadSession();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    ...session,
    isAuthenticated: !!session.token && !!session.user,
  }), [session]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export default function useAuthSession() {
  const session = useContext(AuthSessionContext);

  if (!session) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return session;
}
