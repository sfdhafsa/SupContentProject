import api from '../config/api';

/**
 * Recherche unifiée :
 *  - Films  → TMDB via notre backend (/api/movies/search)
 *  - Users  → BDD locale              (/api/users/search)
 *  - Listes → BDD locale              (/api/lists/public)
 *
 * Films et listes publiques sont accessibles à tous.
 * La recherche utilisateurs n'est lancée que pour une session connectée.
 * Une catégorie en erreur n'empêche pas les autres de s'afficher.
 */
export async function searchAll(query, { includeUsers = false } = {}) {
  if (!query || !query.trim()) {
    return { movies: [], users: [], lists: [] };
  }

  const q = query.trim();

  const searches = [
    _searchMovies(q),
    _searchLists(q),
  ];

  if (includeUsers) {
    searches.push(_searchUsers(q));
  }

  const [moviesResult, listsResult, usersResult] = await Promise.allSettled(searches);

  return {
    movies: moviesResult.status === 'fulfilled' ? moviesResult.value : [],
    users:  includeUsers && usersResult?.status === 'fulfilled' ? usersResult.value : [],
    lists:  listsResult.status  === 'fulfilled' ? listsResult.value  : [],
  };
}

async function _searchMovies(q) {
  const { data } = await api.get(`/movies/search?q=${encodeURIComponent(q)}&page=1`);
  return (data?.data?.results || []).slice(0, 8);
}

async function _searchUsers(q) {
  const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}&limit=5`);
  // Le backend peut retourner data.data, data.users, ou directement un tableau
  const raw = data?.data ?? data?.users ?? data ?? [];
  return Array.isArray(raw) ? raw.slice(0, 5) : [];
}

async function _searchLists(q) {
  const { data } = await api.get(`/lists/public?search=${encodeURIComponent(q)}&limit=5`);
  const raw = data?.lists ?? data?.data ?? data ?? [];
  return Array.isArray(raw) ? raw.slice(0, 5) : [];
}
