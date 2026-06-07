import { useState, useCallback } from 'react';

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useLibrary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: { ...getHeaders(), ...options.headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLibrary = useCallback(
    (status = null) => request(`/library${status ? `?status=${status}` : ''}`),
    [request]
  );

  const getStats = useCallback(() => request('/library/stats'), [request]);

  const getMovieStatus = useCallback(
    (movieId) => request(`/library/movie/${movieId}/status`),
    [request]
  );

  const upsertEntry = useCallback(
    (data, status) =>
      request('/library', {
        method: 'POST',
        body: JSON.stringify({ ...data, status }),
      }),
    [request]
  );

  const removeEntry = useCallback(
    (movieId) => request(`/library/${movieId}`, { method: 'DELETE' }),
    [request]
  );

  const getMyLists = useCallback(
    (userId) => request(`/users/${userId}/lists`),
    [request]
  );

  const getPublicLists = useCallback(
    (page = 1, search = '') =>
      request(`/lists/public?page=${page}&search=${encodeURIComponent(search)}`),
    [request]
  );

  const getListById = useCallback(
    (listId) => request(`/lists/${listId}`),
    [request]
  );

  const createList = useCallback(
    (payload) => request('/lists', { method: 'POST', body: JSON.stringify(payload) }),
    [request]
  );

  const updateList = useCallback(
    (listId, payload) =>
      request(`/lists/${listId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    [request]
  );

  const deleteList = useCallback(
    (listId) => request(`/lists/${listId}`, { method: 'DELETE' }),
    [request]
  );

  const addMovieToList = useCallback(
    (listId, movieId, tmdb_id) =>
      request(`/lists/${listId}/movies`, {
        method: 'POST',
        body: JSON.stringify({ movieId, tmdb_id }),
      }),
    [request]
  );

  const removeMovieFromList = useCallback(
    (listId, movieId) =>
      request(`/lists/${listId}/movies/${movieId}`, { method: 'DELETE' }),
    [request]
  );

  return {
    loading, error,
    getLibrary, getStats, getMovieStatus, upsertEntry, removeEntry,
    getMyLists, getPublicLists, getListById,
    createList, updateList, deleteList,
    addMovieToList, removeMovieFromList,
  };
}