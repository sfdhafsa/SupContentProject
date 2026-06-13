import { Platform } from 'react-native';
import { getAuthToken } from '../services/authStorage';

const getDefaultHost = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';  // émulateur Android
  if (Platform.OS === 'ios') return 'http://localhost:3000';      // simulateur iOS seulement
  return 'http://localhost:3000';                                  // web
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${getDefaultHost()}/api`;
const REQUEST_TIMEOUT_MS = 15000;

function buildUrl(path, params) {
  if (!params) return `${API_BASE_URL}${path}`;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) return `${API_BASE_URL}${path}`;

  const separator = path.includes('?') ? '&' : '?';
  return `${API_BASE_URL}${path}${separator}${query}`;
}

async function request(path, options = {}) {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const { params, ...fetchOptions } = options;
  const headers = {
    Accept: 'application/json',
    ...(fetchOptions.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  let response;

  try {
    response = await fetch(buildUrl(path, params), {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(
        new Error("Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez."),
        { code: 'REQUEST_TIMEOUT' }
      );
    }

    throw Object.assign(
      new Error("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez."),
      { code: 'NETWORK_ERROR', cause: error }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

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
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  put(path, body, options) {
    return request(path, {
      ...options,
      method: 'PUT',
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  patch(path, body, options) {
    return request(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  delete(path, options) {
    return request(path, { ...options, method: 'DELETE' });
  },
};

export default api;
