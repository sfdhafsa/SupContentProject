import { API_BASE_URL } from '../config/api';

function getHeaders() {
  return {
    Accept: 'application/json',
  };
}

export async function searchMovies({ query, page = 1, genre_id }) {
  const params = new URLSearchParams({ q: query, page });
  if (genre_id) params.append('genre_id', genre_id);
  const res = await fetch(`${API_BASE_URL}/movies/search?${params}`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur recherche');
  return data.data;
}

export async function discoverMovies({ page = 1, genre_ids, year_min, year_max, min_rating, sort_by = 'popularity.desc' } = {}) {
  const params = new URLSearchParams({ page, sort_by });
  if (genre_ids?.length > 0) params.append('genre_ids', genre_ids.join(','));
  if (year_min)   params.append('year_min', year_min);
  if (year_max)   params.append('year_max', year_max);
  if (min_rating) params.append('min_rating', min_rating);
  const res = await fetch(`${API_BASE_URL}/movies/discover?${params}`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur discover');
  return data.data;
}

export async function getTrending(timeWindow = 'week') {
  const res = await fetch(`${API_BASE_URL}/movies/trending?time_window=${timeWindow}`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur trending');
  return data.data;
}

export async function getTopRated() {
  const res = await fetch(`${API_BASE_URL}/movies/top-rated`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur top rated');
  return data.data;
}

export async function getNowPlaying() {
  const res = await fetch(`${API_BASE_URL}/movies/now-playing`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur now playing');
  return data.data;
}

export async function getMovieById(tmdbId) {
  const res = await fetch(`${API_BASE_URL}/movies/${tmdbId}`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Film introuvable');
  return data.data;
}

export async function getGenres() {
  const res = await fetch(`${API_BASE_URL}/movies/genres`, {
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erreur genres');
  return data.data;
}
