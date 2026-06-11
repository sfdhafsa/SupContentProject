import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { getAuthToken, getAuthUser } from '../services/authStorage';

export default function useAuthSession() {
  const pathname = usePathname();
  const [session, setSession] = useState({
    loading: true,
    token: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const [token, user] = await Promise.all([getAuthToken(), getAuthUser()]);

      if (!mounted) return;
      setSession({
        loading: false,
        token,
        user,
      });
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  return {
    ...session,
    isAuthenticated: !!session.token,
  };
}
