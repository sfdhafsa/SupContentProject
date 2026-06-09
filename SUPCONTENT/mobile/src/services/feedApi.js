import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authStorage';

const DEFAULT_LIMIT = 20;

export const getFeed = async ({ limit = DEFAULT_LIMIT, offset = 0, order = 'desc' } = {}) => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('No auth token found');
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    order,
  });

  const response = await fetch(`${API_BASE_URL}/social/feed?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Feed request failed with status ${response.status}`);
  }

  return response.json();
};