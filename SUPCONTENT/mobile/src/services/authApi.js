import { API_BASE_URL } from '../config/api';

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  return fallback;
}

export async function loginWithEmail({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
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
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to create account.'));
  }

  return data;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to load user profile.'));
  }

  return data.user ?? data.data ?? data;
}

export function getGoogleOAuthUrl(redirectUri) {
  const params = new URLSearchParams({ redirect_uri: redirectUri });
  return `${API_BASE_URL}/auth/google?${params.toString()}`;
}
