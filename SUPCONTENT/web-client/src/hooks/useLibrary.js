import { useState, useCallback } from 'react';
import api from '../services/api/axios';

export function useLibrary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { body, ...requestOptions } = options;
      const res = await api.request({
        url,
        ...requestOptions,
        data: body ? JSON.parse(body) : undefined,
      });
      return res.data;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Erreur serveur';
      setError(message);
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
