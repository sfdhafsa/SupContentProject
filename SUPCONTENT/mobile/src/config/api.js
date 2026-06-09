import { Platform } from 'react-native';
import { getAuthToken } from '../services/authStorage';

const getDefaultHost = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';  // émulateur Android
  if (Platform.OS === 'ios') return 'http://localhost:3000';      // simulateur iOS seulement
  return 'http://localhost:3000';                                  // web
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${getDefaultHost()}/api`;

async function request(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.msg ||
      `Request failed with status ${response.status}`;

    throw Object.assign(new Error(message), { response: { status: response.status, data } });
  }

  return { data, status: response.status };
}

const api = {
  get(path, options) {
    return request(path, { ...options, method: 'GET' });
  },
  post(path, body, options) {
    return request(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  put(path, body, options) {
    return request(path, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch(path, body, options) {
    return request(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  delete(path, options) {
    return request(path, { ...options, method: 'DELETE' });
  },
};

export default api;
