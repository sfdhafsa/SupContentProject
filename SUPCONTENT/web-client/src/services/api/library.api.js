import api from "./axios";

export const LIBRARY_STATUSES = [
  { value: "TO_WATCH", label: "A voir" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Vu" },
  { value: "DROPPED", label: "Abandonne" },
];

export const libraryApi = {
  getStats: () => api.get("/library/stats"),

  getMine: (status) => api.get("/library", {
    params: status ? { status } : undefined,
  }),

  saveMovie: ({ movieId, tmdb_id, status = "TO_WATCH" }) => api.post("/library", {
    movieId,
    tmdb_id,
    status,
  }),

  removeMovie: (movieId) => api.delete(`/library/${movieId}`),

  getMovieStatus: (movieId) => api.get(`/library/movie/${movieId}/status`),
};
