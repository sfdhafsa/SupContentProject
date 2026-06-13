import api from '../config/api';

/**
 * Recherche unifiée :
 *  - Films  → TMDB via notre backend (/api/movies/search)
 *  - Users  → BDD locale              (/api/users/search)
 *  - Listes → BDD locale              (/api/lists/public)
 *
 * Fonctionne connecté ET non connecté.
 * Si /users/search retourne 401 (non connecté), ça n'empêche pas
 * les films et listes de s'afficher (Promise.allSettled).
 */
export async function searchAll(query) {
  if (!query || !query.trim()) {
    return { movies: [], users: [], lists: [] };
  }

  const q = query.trim();

  const [moviesResult, usersResult, listsResult] = await Promise.allSettled([
    _searchMovies(q),
    _searchUsers(q),
    _searchLists(q),
  ]);

  return {
    movies: moviesResult.status === 'fulfilled' ? moviesResult.value : [],
    users:  usersResult.status  === 'fulfilled' ? usersResult.value  : [],
    lists:  listsResult.status  === 'fulfilled' ? listsResult.value  : [],
  };
}

async function _searchMovies(q) {
  const { data } = await api.get(`/movies/search?query=${encodeURIComponent(q)}&page=1`);
  return (data?.data?.results || []).slice(0, 8);
}

async function _searchUsers(q) {
  const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}&limit=5`);
  // Le backend peut retourner data.data, data.users, ou directement un tableau
  const raw = data?.data ?? data?.users ?? data ?? [];
  return Array.isArray(raw) ? raw.slice(0, 5) : [];
}

async function _searchLists(q) {
  const { data } = await api.get(`/lists/public?q=${encodeURIComponent(q)}&limit=5`);
  const raw = data?.data ?? data?.lists ?? data ?? [];
  return Array.isArray(raw) ? raw.slice(0, 5) : [];
}