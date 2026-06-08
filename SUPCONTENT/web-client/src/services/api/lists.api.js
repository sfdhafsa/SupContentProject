import api from "./axios";

export const listsApi = {
  getPublic: ({ page = 1, limit = 20, search = "" } = {}) =>
    api.get("/lists/public", { params: { page, limit, search } }),

  searchFollowing: (query, limit = 6) =>
    api.get("/lists/following/search", { params: { q: query, limit } }),

  getUserLists: (userId) => api.get(`/users/${userId}/lists`),

  getById: (listId) => api.get(`/lists/${listId}`),

  create: ({ name, description = "", isPublic = false }) =>
    api.post("/lists", { name, description, isPublic }),

  update: (listId, { name, description, isPublic }) =>
    api.put(`/lists/${listId}`, { name, description, isPublic }),

  remove: (listId) => api.delete(`/lists/${listId}`),

  addMovie: (listId, { movieId, tmdb_id }) =>
    api.post(`/lists/${listId}/movies`, { movieId, tmdb_id }),

  removeMovie: (listId, movieId) => api.delete(`/lists/${listId}/movies/${movieId}`),
};
