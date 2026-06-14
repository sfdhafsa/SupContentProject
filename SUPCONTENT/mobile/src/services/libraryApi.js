import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authStorage';

async function getAuthHeaders() {
  const token = await getAuthToken();

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getLibrary(status = null) {
  const url = `${API_BASE_URL}/library${status ? `?status=${status}` : ''}`;
  const res = await fetch(url, { headers: await getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function getLibraryStats() {
  const res = await fetch(`${API_BASE_URL}/library/stats`, { headers: await getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function upsertLibraryEntry(movieId, tmdb_id, status) {
  const res = await fetch(`${API_BASE_URL}/library`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ movieId, tmdb_id, status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function removeLibraryEntry(movieId) {
  const res = await fetch(`${API_BASE_URL}/library/${movieId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function getMyLists(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/lists`, { headers: await getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function getPublicLists({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    params.set('search', search);
  }

  const res = await fetch(`${API_BASE_URL}/lists/public?${params.toString()}`, {
    headers: {
      ...await getAuthHeaders(),
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function createList(payload) {
  const res = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function updateList(listId, payload) {
  const res = await fetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function deleteList(listId) {
  const res = await fetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function addMovieToList(listId, movieId, tmdb_id) {
  const res = await fetch(`${API_BASE_URL}/lists/${listId}/movies`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ movieId, tmdb_id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export async function removeMovieFromList(listId, movieId) {
  const res = await fetch(`${API_BASE_URL}/lists/${listId}/movies/${movieId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}
