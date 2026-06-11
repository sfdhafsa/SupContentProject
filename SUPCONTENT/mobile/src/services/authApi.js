import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from './authStorage';

function getJsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  return fallback;
}

export async function loginWithEmail({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Invalid email or password.'));
  }

  return data;
}

export async function registerWithEmail({ username, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to create account.'));
  }

  return data;
}

export async function getCurrentUser(token) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        ...getJsonHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw Object.assign(new Error('Unable to reach the API.'), {
      code: 'NETWORK_ERROR',
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(
      new Error(getErrorMessage(data, 'Unable to load user profile.')),
      { status: response.status }
    );
  }

  return data.user ?? data.data ?? data;
}

export function getGoogleOAuthUrl(redirectUri, client = 'mobile') {
  const params = new URLSearchParams({ client, redirect_uri: redirectUri });
  return `${API_BASE_URL}/auth/google?${params.toString()}`;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getAuthUser();

        if (!mounted) return;
        setToken(storedToken);
        setUser(storedUser);

        if (storedToken) {
          const freshUser = await getCurrentUser(storedToken);
          if (!mounted) return;
          setUser(freshUser);
          await saveAuthSession(storedToken, freshUser);
        }
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          await clearAuthSession();
        }
        if (!mounted) return;
        if (error?.status === 401 || error?.status === 403) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isAuthenticated: !!token && !!user,
    loading,
    token,
    user,
  };
}
